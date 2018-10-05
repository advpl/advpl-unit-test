import {RendererCoverage, LinesToDraw} from './renderer';
import * as vscode from 'vscode';
import * as coverage from 'coverage';

export class CoverageAgent{
  private lCov: coverage.LCov;
  private context: vscode.ExtensionContext;
  private active:boolean;
  private renderer :RendererCoverage;
  private statusBarItem: vscode.StatusBarItem;
  private disposeActionListener:vscode.Disposable;
  //private statusBarEditorWatcher: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext){
    this.context = context;
    this.active = false;
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.statusBarItem.tooltip = "Show or remove coverage base on Application Server information - LCOV."
  }

  public async displayCoverageForActiveFile() {
    try {
      
      if (this.disposeActionListener === undefined) {
        this.disposeActionListener = vscode.window.onDidChangeActiveTextEditor(this.displayCoverageForActiveFile, this);  
      }

      if(this.prepareRender()) {
        this.renderer.draw();
        this.setRemoveCoverage();
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private prepareRender():boolean{
    let found:boolean = false;
    let textEditor = vscode.window.activeTextEditor;
    
    const re = new RegExp(/(\w+.PR\w)/g);
     
    // Remove all decorations first to prevent graphical issues
    
    const doc = textEditor.document;

    if ("advpl" === doc.languageId ) {
                    
        const filePath: string  = doc.uri.fsPath;
        let matches = re.exec(doc.fileName.toUpperCase());
        if (matches !== null) {
            for (let tn of this.lCov.TNs) {
                if (tn.SF === matches[0]) {
                    const lnDw = new LinesToDraw(tn.lines);
                    this.renderer = new RendererCoverage(textEditor, lnDw);
                    found = true;                      
                }               
            }
        }
    }

    return found;
  }

  public async removeCoverageForActiveFile() {
    
    try {

      this.disposeActionListener.dispose();
      this.renderer.removeDecorationsForEditor();
      this.setDisplayCoverage();
      
    } catch (error) {
      this.handleError(error);
    }
  }

  private setRemoveCoverage(){
    this.statusBarItem.command = "advpl.unittest.removeCoverage";
    this.statusBarItem.text = "Remove Coverage on Active Editor."
  }

  private setDisplayCoverage(){
    this.statusBarItem.command = "advpl.unittest.showCoverage";
    this.statusBarItem.text = "Display Coverage on Active Editor.";
  }

  public set newLCov(lCov:coverage.LCov){

    console.log("Covered Files:");
    for(const tn of lCov.TNs){
      console.log(tn.SF);
    }
    
    this.lCov = lCov;
  }
  private registerCommands(){
    const display = vscode.commands.registerCommand("advpl.unittest.showCoverage", () => {
      this.displayCoverageForActiveFile();
    });

    const remove = vscode.commands.registerCommand("advpl.unittest.removeCoverage", () => {
      this.removeCoverageForActiveFile();
    });

    this.context.subscriptions.push(remove);
    this.context.subscriptions.push(display);
  }

  public activeAgent(){
    if(this.active) return;
    
    this.registerCommands();

    /*Create status bar button */
    this.setDisplayCoverage();
    this.context.subscriptions.push(this.statusBarItem);
    this.statusBarItem.show();

    this.active = true;
  }
  
  private handleError(error: Error) {
    const message = error.message ? error.message : error;
    const stackTrace = error.stack;
    const outputChannel: vscode.OutputChannel = vscode.window.createOutputChannel("Advpl Unit Test.");
    vscode.window.showWarningMessage(message.toString());
    outputChannel.appendLine(`[${Date.now()}][gutters]: Error ${message}`);
    outputChannel.appendLine(`[${Date.now()}][gutters]: Stacktrace ${stackTrace}`);

    if (error) {
        console.error(message.toString());
        console.error( stackTrace ? stackTrace.toString() : undefined);
    }
  }
}
/* 
private createWatcher(file:string, renderer:RendererCoverage){
  let pattern = path.join(file);
  let rakePromise: Thenable<vscode.Task[]> | undefined = undefined;
  let fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);
  fileWatcher.onDidChange(
      (filePath) => {
          renderer.draw();  
      }
  );
  fileWatcher.onDidCreate(() => rakePromise = undefined);
  fileWatcher.onDidDelete(() => rakePromise = undefined);
  
}

private getRelativePath(lcov: LCov) {
  const re = new RegExp(/\w+.PRW/g);
  let matches;

  for( const tn of lcov.TNs){
      
     tn.SF = this.getRelativePathInWorkspace((vscode.workspace.rootPath + "\\src\\"), tn.SF);
      
  }

  return lcov;
}

private getRelativePathInWorkspace(dir: string, fileName: string) {
  const files = fs.readdirSync(dir);
  let str: string = fileName;
  for (const file of files) {
      const dirStt: fs.Stats = fs.lstatSync((dir + file));
      if (dirStt === null) {
          return "";
      }
      if (dirStt.isDirectory()) {
          str = this.getRelativePathInWorkspace( (dir + file + "\\"), fileName);
          if ( str !== fileName) {
              return str;
          }
      }
      if (file.toUpperCase() === fileName) {
          return (dir + file);
      }
  }
  return str;
}

private replaceCurrentFilePath(textEditors: vscode.TextEditor[], lcov: LCov){   

  for( const textDocument of vscode.workspace.textDocuments ) {
      const re = new RegExp(/(\w+.PR[X,W,Y])/g);
      const filePath: string  = textDocument.uri.fsPath; 
      let matches = re.exec(textDocument.fileName.toUpperCase());
      if  (matches !== null) {
          for (let file of lcov.TNs) {
              if (file.SF === matches[0]) {
                  file.SF = filePath;
              }               
          }
      }
  }
  return lcov;
} */