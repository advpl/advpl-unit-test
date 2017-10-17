'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {AdvplUnitTest} from './AdvplUnitTest';
import {AdvplRunner} from './AdvplRunner';
import * as analyse from '../src/CodeAnalyser';
import * as jsresult from '../src/TestResult';
import * as path from 'path';
let advplExt = vscode.extensions.getExtension('KillerAll.advpl-vscode');
let consoleAdvpl = advplExt.exports
let oTdd;
let bfinish;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

     const unitTest = AdvplUnitTest.getInstance();
    oTdd = new TddBusiness();
    unitTest.activate();
    context.subscriptions.push(unitTest);
    context.subscriptions.push(runUnitTest());
    consoleAdvpl.writeAdvplConsole("Advpl Unit test initiated!")

}

// this method is called when your extension is deactivated
export function deactivate() {
}

function runUnitTest()
{
   
let disposable = vscode.commands.registerCommand('advpl.unittest.run', function (context)  {
        
        var editor = vscode.window.activeTextEditor;
        var cSource = editor.document.fileName;
        if (editor.document.isDirty)
        {
            let list = ["Sim","Não"];
            vscode.window.showQuickPick(list,{placeHolder:"O arquivo não está salvo e foi modificado, deseja salva-lo antes de compilar?"}).then(function(select){
            console.log(select);
            
            if (select==="Sim")
            {
                editor.document.save().then(function(select)
                {
                __internal_run(cSource,editor);
                }
            )
               
            }
            else
            {
                vscode.window.setStatusBarMessage('Ação cancelado pelo usuario, fonte não compilado!!!',5000);
            }
        })
            
            
        }
        else
        {
            __internal_run(cSource,editor);
        }
       

});
return disposable;
}
function isFinish()
{
    return bfinish;
}
function __internal_run(cSource,editor)
{
        bfinish = false;
        
        vscode.window.withProgress({ location: vscode.ProgressLocation.Window, title: 'Advpl Test Unit'}, p => {
            return new Promise((resolve, reject) => {
                p.report({message: 'Executando...' });
                let count= 0;
                let nextFinish = false;
                let handle = setInterval(() => {                    
                    p.report({message: 'Executando...' });
                    
                    if (isFinish()) {                        
                        p.report({message: 'Finalizado!' });
                        nextFinish = true;
                        bfinish = false;
                    }
                    else
                    {
                        if(nextFinish){
                            clearInterval(handle);
                            resolve();
                        }
                    }
                }, 1000);
            });
        });
    
    var runner  = new AdvplRunner(JSON.stringify(vscode.workspace.getConfiguration("advpl")));        
        runner.setAfterExec(function (){
            let res = runner.getResult();
            if (res != null)
            {
                oTdd.showTestResults(res);        
            }
            consoleAdvpl.writeAdvplConsole("[Advpl Unit Test] - Finalizado");
            bfinish = true;
        });        
        consoleAdvpl.writeAdvplConsole("-------------------------------------------------------");
        consoleAdvpl.writeAdvplConsole("----ADVPL Unit Test Running----------------------------");
        consoleAdvpl.writeAdvplConsole("-------------------------------------------------------");        
        consoleAdvpl.writeAdvplConsole("[Advpl Unit Test] - Iniciando a execução do TestCase:" +  cSource.replace(/^.*[\\\/]/, ''));
        runner.runUnitTest(cSource);
       
    
}

export class TddBusiness {
    private _failedDecorator: vscode.TextEditorDecorationType;
    private _passedDecorator: vscode.TextEditorDecorationType;

    //public static nunitResultsFilePath: string = path.join(vscode.workspace.rootPath, 'TestResult.xml');


    constructor() {
        this._failedDecorator = vscode.window.createTextEditorDecorationType({
            cursor: 'crosshair',
            backgroundColor: 'rgba(255,0,0,0.3)'
        });

        this._passedDecorator = vscode.window.createTextEditorDecorationType({
            cursor: 'crosshair',
            backgroundColor: 'rgba(0,255,0,0.3)'
        });
    }
  public showTestResults(resultTest) {
        let texteditor = vscode.window.activeTextEditor
        let currentDocument = texteditor.document;
            this.cleanUpPreviousResults(texteditor);
            let tests = resultTest;
            if (tests.runned)
            {
                var analyser = new analyse.CodeAnalyser();
                //consoleAdvpl.writeAdvplConsole
                var decoratorsFailed = analyser.getDecorationOptions(tests.methods, currentDocument, "failed",false,consoleAdvpl);
                var decoratorsPassed = analyser.getDecorationOptions(tests.methods, currentDocument, "passed",true,consoleAdvpl);
                texteditor.setDecorations(this._failedDecorator, decoratorsFailed);
                texteditor.setDecorations(this._passedDecorator, decoratorsPassed);
            }
            else
            {
                consoleAdvpl.writeAdvplConsole("Fonte não possui teste unitario");
            }
    
    /*let parser = new resultParser.NunitResultParser();
        let nunitResult: jsresult.TestResult;
        vscode.workspace.openTextDocument(TddBusiness.nunitResultsFilePath).then((document) => {
            nunitResult = parser.parseResult(document.getText());
        }).then(() => {
            vscode.window.visibleTextEditors.forEach(texteditor => {
                let currentDocument = texteditor.document;
                this.cleanUpPreviousResults(texteditor);
                let tests = nunitResult.getResultsByClass(this.getClassName(currentDocument.getText()));
                var analyser = new analyse.CodeAnalyser();

                var decoratorsFailed = analyser.getDecorationOptions(tests.failed, currentDocument, "failed");
                var decoratorsPassed = analyser.getDecorationOptions(tests.passed, currentDocument, "passed");
                texteditor.setDecorations(this._failedDecorator, decoratorsFailed);
                texteditor.setDecorations(this._passedDecorator, decoratorsPassed);
            });

        });*/
    }
     private cleanUpPreviousResults(texteditor:vscode.TextEditor) {
        texteditor.setDecorations(this._failedDecorator, []);
        texteditor.setDecorations(this._passedDecorator, []);
    }
}