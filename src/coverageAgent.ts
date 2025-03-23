import {RendererCoverage, LinesToDraw} from './renderer';
import * as vscode from 'vscode';
import * as coverage from 'coverage';
import * as path from 'path';

export class CoverageAgent{
  private lCov: coverage.LCov;
  private context: vscode.ExtensionContext;
  private active:boolean;
  private renderer :RendererCoverage;
  private statusBarItem: vscode.StatusBarItem;
  private enableCoverageBarItem: vscode.StatusBarItem;
  private disposeActionListener:vscode.Disposable;
  private alreadyDisplayed: Array<string>;
  //private statusBarEditorWatcher: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext){
    this.context = context;
    this.active = false;
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.statusBarItem.tooltip = "Show or remove coverage base on Application Server information - LCOV."

    this.enableCoverageBarItem = vscode.window.createStatusBarItem();
    this.enableCoverageBarItem.tooltip = "Enables or disables the generation of code coverage."
    this.alreadyDisplayed = [];
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
    
    const doc = textEditor.document;
    const fileName = path.basename(doc.fileName).toUpperCase();

    if ("advpl" === doc.languageId ) {
        for (let tn of this.lCov.TNs) {
            if (tn.SF === fileName) {
                const lnDw = new LinesToDraw(tn.lines);
                this.renderer = new RendererCoverage(textEditor, lnDw);
                found = true;

                if (this.alreadyDisplayed.indexOf(fileName) === -1) {
                  let advplExp = vscode.extensions.getExtension('KillerAll.advpl-vscode').exports;
                  let sourceSize:number = tn.lines.length;
                  let coveredLines: number = tn.lines.filter(book => book.hits !== "0").length;

                  advplExp.writeAdvplConsole(`Source ${fileName} has ${sourceSize} lines and ${coveredLines} lines were covered, generating ${((coveredLines/sourceSize)*100).toFixed(2)}% code coverage.`);
                  this.alreadyDisplayed.push(fileName);
                }
            }               
        }
    }

    return found;
  }

  public clearAlreadyDisplayedSources(): void {
    this.alreadyDisplayed = [];
  }

  public async removeCoverageForActiveFile() {
    
    try {

      if (this.disposeActionListener !== undefined) {
        this.disposeActionListener.dispose();
        this.renderer.removeDecorationsForEditor();
        this.setDisplayCoverage();
      }
      
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
    if (lCov.TNs !== undefined) {
      for(const tn of lCov.TNs){
        console.log(tn.SF);
      }
    }
    else {
      let err:Error;
      err.message = "Invalid coverage";
      this.handleError(err);
      return;
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
    this.context.subscriptions.push(this.statusBarItem);
  }

  public activeAgent(){
    if(this.active || this.lCov.TNs === undefined) return;
    
    this.registerCommands();

    /*Create status bar button */
    this.setDisplayCoverage();
        
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

  public enableCoverage() {
    let enableCoverage = vscode.workspace.getConfiguration("advpl");
    let booleanEnableCoverage = enableCoverage.get<boolean>("enableCoverage");

    if (booleanEnableCoverage === undefined ) throw new Error("advpl-unittest.ADVPLENABLECOVERAGE not configured");
    if (!booleanEnableCoverage) {
      this.statusBarItem.show();
      this.enableCoverageBarItem.text = "Coverage Enabled .";
      enableCoverage.update("enableCoverage",  true);
    }
    else {
      this.statusBarItem.hide();
      this.removeCoverageForActiveFile();
      enableCoverage.update("enableCoverage", false);
      this.enableCoverageBarItem.text = "Coverage Disabled.";
    }
  }

  public activeCoverageButton(){
    const enableCoverage = vscode.commands.registerCommand("advpl.unittest.enableCoverage", () => {
      this.enableCoverage();
    });

    if (vscode.workspace.getConfiguration("advpl").get<boolean>("enableCoverage")) {
      this.enableCoverageBarItem.text = "Enabled coverage.";
    }
    else {
      this.enableCoverageBarItem.text = "Disabled coverage.";
    }

    this.enableCoverageBarItem.show();

    this.enableCoverageBarItem.command = "advpl.unittest.enableCoverage";
    this.context.subscriptions.push(enableCoverage);
    this.context.subscriptions.push(this.enableCoverageBarItem);
    
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