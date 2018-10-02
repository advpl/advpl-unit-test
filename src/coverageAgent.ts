import {RendererCoverage} from './renderer';
import * as vscode from 'vscode';
import * as coverage from 'coverage';

export class CoverageAgent{
  private renderer :RendererCoverage;
  private context: vscode.ExtensionContext;
  private active:boolean;
  private statusBarItem: vscode.StatusBarItem;
  //private statusBarEditorWatcher: vscode.StatusBarItem;
  private EditorWatcher: boolean;

  constructor(context: vscode.ExtensionContext){
    this.context = context;
    this.active = false;
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.statusBarItem.tooltip = "Show or remove coverage base on Application Server information -  LCOV."
//    this.statusBarEditorWatcher = vscode.window.createStatusBarItem();
//    this.statusBarEditorWatcher.tooltip = "Show coverage on active editor.";
    vscode.window.onDidChangeActiveTextEditor(this.callRenderCoverage, this);  
  }

  public async displayCoverageForActiveFile() {
    try {
      this.EditorWatcher = true;
      this.renderer.drawCoverage();
      this.setRemoveCoverage();
    } catch (error) {
      this.handleError(error);
    }
  }
  private callRenderCoverage(){
    if (this.EditorWatcher){
      this.renderer.drawCoverage();
    }
  }

  private setRemoveCoverage(){
    this.statusBarItem.command = "advpl.unittest.removeCoverage";
    this.statusBarItem.text = "Remove Coverage on Active Editor."
  }

  public async removeCoverageForActiveFile() {
    try {
      
      this.EditorWatcher = false;
      this.renderer.removeDecorationsForEditor();
      this.setDisplayCoverage();
      
    } catch (error) {
      this.handleError(error);
    }
  }

  private setDisplayCoverage(){
    this.statusBarItem.command = "advpl.unittest.showCoverage";
    this.statusBarItem.text = "Display Coverage on Active Editor.";
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

  public set newLCov(lCov:coverage.LCov){
    console.log("Covered Files:");
    for(const tn of lCov.TNs){
      console.log(tn.SF);
    }
    
    this.renderer = new RendererCoverage(lCov);
  }

  public activeAgent(){
    if(this.active) return;
    
    const display = vscode.commands.registerCommand("advpl.unittest.showCoverage", () => {
      this.displayCoverageForActiveFile();
    });


    const remove = vscode.commands.registerCommand("advpl.unittest.removeCoverage", () => {
      this.removeCoverageForActiveFile();
    });

    this.context.subscriptions.push(remove);
    this.context.subscriptions.push(display);

    /*Create status bar button */
    this.setDisplayCoverage();
    this.context.subscriptions.push(this.statusBarItem);
    this.statusBarItem.show();

    /*const editorWatcherActive = vscode.commands.registerCommand("advpl.unittest.editorWatcherActive", () => {
      this.displayCoverageForActiveFile();
    });


    const editorWatcherDesactive = vscode.commands.registerCommand("advpl.unittest.editorWatcherDesactive", () => {
      this.removeCoverageForActiveFile();
    });

    this.context.subscriptions.push(editorWatcherActive);
    this.context.subscriptions.push(editorWatcherDesactive);

    this.context.subscriptions.push(this.statusBarEditorWatcher);
    this.statusBarEditorWatcher.show();*/

    this.active = true;
    this.EditorWatcher = false;
  }
}
