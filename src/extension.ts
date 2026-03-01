import * as vscode from 'vscode';

// ✅ STEP 1: Define secret patterns to detect
// const SECRET_PATTERNS = [
// 	{ name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
// 	{ name: "Generic API Key", regex: /api[_-]?key\s*=\s*['"][a-zA-Z0-9\-_]{16,}['"]/gi },
// 	{ name: "JWT Token", regex: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g },
// 	{ name: "Private Key", regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/g },
// 	{ name: "Database Password", regex: /db[_-]?password\s*=\s*['"][^'"]{6,}['"]/gi },
// 	{ name: "Secret Key", regex: /secret[_-]?key\s*=\s*['"][^'"]{6,}['"]/gi },
// ];

const SECRET_PATTERNS = [
	// Known variable name patterns
	{ name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/g },
	{ name: "Generic API Key", regex: /api[_-]?key\s*=\s*['"][a-zA-Z0-9\-_]{16,}['"]/gi },
	{ name: "JWT Token", regex: /eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*/g },
	{ name: "Private Key", regex: /-----BEGIN (RSA|EC|OPENSSH) PRIVATE KEY-----/g },
	{ name: "Database Password", regex: /db[_-]?password\s*=\s*['"][^'"]{6,}['"]/gi },
	{ name: "Secret Key", regex: /secret[_-]?key\s*=\s*['"][^'"]{6,}['"]/gi },

	// Value-based patterns (works regardless of variable name)
	{ name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9]{32,}/g },
	{ name: "GitHub Token", regex: /ghp_[a-zA-Z0-9]{36}/g },
	{ name: "Stripe Secret Key", regex: /sk_live_[a-zA-Z0-9]{24,}/g },
	{ name: "Stripe Publishable Key", regex: /pk_live_[a-zA-Z0-9]{24,}/g },
	{ name: "Slack Token", regex: /xox[baprs]-[a-zA-Z0-9\-]{10,}/g },
	{ name: "Google API Key", regex: /AIza[0-9A-Za-z\-_]{35}/g },
	{ name: "Twilio API Key", regex: /SK[a-zA-Z0-9]{32}/g },
	{ name: "Suspicious High Entropy String", regex: /['"][a-zA-Z0-9\-_]{32,}['"]/g },
];

// ✅ STEP 2: Create a diagnostic collection (this powers the squiggly red lines)
const diagnosticCollection = vscode.languages.createDiagnosticCollection('secretguard');

// ✅ STEP 3: Core scan function
function scanDocument(document: vscode.TextDocument, provider?: SecretGuardProvider) {
	const diagnostics: vscode.Diagnostic[] = [];
	const text = document.getText();
	const foundSecrets: { name: string; line: number }[] = [];

	SECRET_PATTERNS.forEach(({ name, regex }) => {
		let match;
		regex.lastIndex = 0;
		while ((match = regex.exec(text)) !== null) {
			const startPos = document.positionAt(match.index);
			const endPos = document.positionAt(match.index + match[0].length);
			const range = new vscode.Range(startPos, endPos);

			const diagnostic = new vscode.Diagnostic(
				range,
				`⚠️ SecretGuard: Possible ${name} detected! Remove before committing.`,
				vscode.DiagnosticSeverity.Error
			);

			diagnostics.push(diagnostic);

			// Also collect for sidebar
			foundSecrets.push({ name, line: startPos.line });
		}
	});

	diagnosticCollection.set(document.uri, diagnostics);

	// Update sidebar if provider is available
	if (provider) {
		provider.updateSecrets(document.uri.fsPath, foundSecrets);
	}
}
// ✅ SIDEBAR: Tree item representing each node in the panel
class SecretItem extends vscode.TreeItem {
	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly filePath?: string,
		public readonly lineNumber?: number
	) {
		super(label, collapsibleState);

		// If it's a secret item (has line number), show warning icon and make it clickable
		if (lineNumber !== undefined && filePath) {
			this.iconPath = new vscode.ThemeIcon('warning');
			this.description = `Line ${lineNumber + 1}`;
			this.tooltip = `Click to jump to Line ${lineNumber + 1} in ${filePath}`;

			// Clicking the item jumps to that line in the file
			this.command = {
				command: 'vscode.open',
				title: 'Open File',
				arguments: [
					vscode.Uri.file(filePath),
					{
						selection: new vscode.Range(lineNumber, 0, lineNumber, 0)
					}
				]
			};
		} else {
			// It's a file node
			this.iconPath = new vscode.ThemeIcon('file');
		}
	}
}

// ✅ SIDEBAR: The actual data provider that feeds the tree view
class SecretGuardProvider implements vscode.TreeDataProvider<SecretItem> {

	// This event tells VS Code to refresh the panel when secrets change
	private _onDidChangeTreeData = new vscode.EventEmitter<void>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	// Stores all found secrets: { filePath -> list of secrets }
	private secretsMap: Map<string, { name: string; line: number }[]> = new Map();

	// Called by VS Code to get each item in the tree
	getTreeItem(element: SecretItem): vscode.TreeItem {
		return element;
	}

	// Called by VS Code to get children of each node
	getChildren(element?: SecretItem): SecretItem[] {
		if (!element) {
			// Root level — return file nodes
			if (this.secretsMap.size === 0) {
				return [new SecretItem('✅ No secrets found!', vscode.TreeItemCollapsibleState.None)];
			}
			return Array.from(this.secretsMap.keys()).map(filePath => {
				const fileName = filePath.split('/').pop() || filePath;
				return new SecretItem(fileName, vscode.TreeItemCollapsibleState.Expanded, filePath);
			});
		} else {
			// Child level — return secrets inside a file
			const secrets = this.secretsMap.get(element.filePath || '') || [];
			return secrets.map(secret =>
				new SecretItem(
					`⚠️ ${secret.name}`,
					vscode.TreeItemCollapsibleState.None,
					element.filePath,
					secret.line
				)
			);
		}
	}

	// Called by our scan function to update the panel
	updateSecrets(filePath: string, secrets: { name: string; line: number }[]) {
		if (secrets.length === 0) {
			this.secretsMap.delete(filePath);
		} else {
			this.secretsMap.set(filePath, secrets);
		}
		this._onDidChangeTreeData.fire(); // triggers panel refresh
	}
}

// ✅ STEP 4: Activate the extension
export function activate(context: vscode.ExtensionContext) {
	console.log('SecretGuard is now active!');

	// ✅ Create sidebar provider
	const sidebarProvider = new SecretGuardProvider();

	// ✅ Register the Tree View in the sidebar
	const treeView = vscode.window.createTreeView('secretguardPanel', {
		treeDataProvider: sidebarProvider,
		showCollapseAll: true
	});

	// Scan when a file is opened
	vscode.workspace.onDidOpenTextDocument(doc => scanDocument(doc, sidebarProvider));

	// Scan in real time as user types
	vscode.workspace.onDidChangeTextDocument(e => scanDocument(e.document, sidebarProvider));

	// Scan all already open files when extension activates
	vscode.workspace.textDocuments.forEach(doc => scanDocument(doc, sidebarProvider));

	// Status bar
	const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
	statusBar.text = "$(shield) SecretGuard: Active";
	statusBar.tooltip = "SecretGuard is scanning for secrets";
	statusBar.show();

	// Manual scan command
	const disposable = vscode.commands.registerCommand('secretguard.scan', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			scanDocument(editor.document, sidebarProvider);
			vscode.window.showInformationMessage('SecretGuard: Scan complete!');
		}
	});

	context.subscriptions.push(disposable, statusBar, diagnosticCollection, treeView);
}

// ✅ STEP 7: Cleanup when extension is deactivated
export function deactivate() {
	diagnosticCollection.dispose();
}