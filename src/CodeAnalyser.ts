'use strict';
import * as vscode from 'vscode';
import * as jsresult from '../src/TestResult';

export class CodeAnalyser{

private _decorator: vscode.TextEditorDecorationType;

public constructor() {

}

/**
 * Analyses the code of a given TextDocument and returns the DecorationOptions for vscode
 */
public getDecorationOptions(methods, document:vscode.TextDocument,hoverHint:string,success,advplExt,onlySkip: boolean):vscode.DecorationOptions[] {
    var results : vscode.DecorationOptions[] = [];
    
    if(methods.length==0) return results;
    if(!document) return results;
    
    var content = document.getText();
    var exp = "" ;// methods[0].methodname;
    
    for (var index = 0; index < methods.length; index++)
    {
        //When the test is skipped, its status is equal to success.
        if(onlySkip)
        {
            if (methods[index].skiped)
            {
                advplExt.writeAdvplConsole("[Advpl Unit Test] Method " + methods[index].methodname + " skipped! Message:" +methods[index].message );
                exp += methods[index].methodname + "|";
            }
        }
        else
        {
            if (methods[index].success == success && !methods[index].skiped)
            {
                advplExt.writeAdvplConsole("[Advpl Unit Test] Method " + methods[index].methodname +  (success ? " success!":(" FAILED!" + " Message:" +methods[index].message) ));
                exp += methods[index].methodname + "|";
            }
        }
    }

    exp = exp.substr(0,exp.length-1);

    if(!(exp===""))
    {
        var re1 = new RegExp("\\b("+ exp +")\\b","g");
        var match;
        while(match = re1.exec(content)){
            var startPos = document.positionAt(match.index);
            var endPos = document.positionAt(match.index + match[0].length);
            results.push( { range: new vscode.Range(startPos, endPos), hoverMessage: hoverHint + ' test ' + match[0].toString()});   
            
        }
    }
    
    return results;
}

}