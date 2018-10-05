import * as vscode from 'vscode';
//import {Config}  from './config';
import {Line, LCov} from "coverage";





export class RendererCoverage {
    //private configStore: Config;
    private lnDw: LinesToDraw;
    private decorator :Decorators;
    private textEditor:vscode.TextEditor;
    constructor(textEditor:vscode.TextEditor, lnDw: LinesToDraw) {
        this.textEditor = textEditor;
        this.lnDw = lnDw;
        this.decorator = new Decorators();
    }

    public draw() {
        this.clearDecorators();
        this.setDecorationsForEditor();
    }

    private clearDecorators(){
        this.textEditor.setDecorations(
            this.decorator.getCovered(),
            []
        );
        this.textEditor.setDecorations(
            this.decorator.getLineTocover(),
            []
        );
    }
    

    public removeDecorationsForEditor() {
 
        this.decorator.decoratorReset();
      
    }

    private setDecorationsForEditor() {
        
        this.textEditor.setDecorations(
            this.decorator.getCovered(),
            this.lnDw.covered
        );
        this.textEditor.setDecorations(
            this.decorator.getLineTocover(),
            this.lnDw.noCovered
        );
    }    
}

class Decorators {
    private covered: vscode.TextEditorDecorationType;
    private lineTocover: vscode.TextEditorDecorationType;
    private clearDecorator: vscode.TextEditorDecorationType;
    constructor(){
        this.initialize();
    }

    public getCovered() :vscode.TextEditorDecorationType {
        return this.covered;
    }

    public getLineTocover() :vscode.TextEditorDecorationType {
        return this.lineTocover;
    }

    public getClearDecorator() :vscode.TextEditorDecorationType {
        return this.clearDecorator;
    }

    public decoratorReset(){
        this.getCovered().dispose();
        this.getLineTocover().dispose();
        this.initialize();
    }

    private initialize(){
        this.covered =  vscode.window.createTextEditorDecorationType({
            backgroundColor: "rgba(45, 165, 10, 0.75)",
            isWholeLine: true
        });
        this.lineTocover = vscode.window.createTextEditorDecorationType({
            backgroundColor: "rgba(165, 10, 0, 0.75)",
            isWholeLine: true
        });
        this.clearDecorator = vscode.window.createTextEditorDecorationType({
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            isWholeLine: true
        });
    }
}

export class LinesToDraw {
    covered: vscode.Range[];
    partial: vscode.Range[];
    noCovered: vscode.Range[];

    constructor(lines: Array<Line>){
        this.covered = new Array<vscode.Range>();
        this.partial = new Array<vscode.Range>();
        this.noCovered = new Array<vscode.Range>();
        
        this.generateLinesCover(lines);
    }

    public generateLinesCover(lines: Array<Line>){

        for(let line of lines){
            const lineRange = new vscode.Range(Number(line.DA) - 1, 0, Number(line.DA) - 1, 0);
            if (Number(line.hits) > 0) {
                this.covered.push(lineRange);
            } else {
                this.noCovered.push(lineRange);
            }
        }
    }
}

/*     public drawCoverage():boolean {
        let found:boolean = false;
        let textEditors = vscode.window.visibleTextEditors;
        
        for( let textEditor of textEditors) {
            // Remove all decorations first to prevent graphical issues
            
            const doc = textEditor.document;
            const filePath: string  = doc.uri.fsPath;

            if ("advpl" === doc.languageId ) {
                
                for (let tn of this.lcov.TNs) {
                    if (tn.SF === filePath) {
                        found = true;
                        this.clearDecorators(textEditor);
                        this.setDecorationsForEditor(textEditor, tn.lines);
                    }               
                }
            }
        }
        return found;
    } */