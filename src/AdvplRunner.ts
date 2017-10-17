import * as child_process from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
export class AdvplRunner {
    private EnvInfos :string;
    private debugPath : string;
    private consoleReturn : string;
    public _result : string;
    private afterExec;    
    private testResult;    

    constructor(jSonInfos : string )
    {
        
        this.EnvInfos = jSonInfos;
        this.debugPath = vscode.extensions.getExtension("KillerAll.advpl-vscode").extensionPath;
        this._result = "";
        if(process.platform == "darwin")
        {
            this.debugPath += "/bin/AdvplDebugBridgeMac";
        }
        else
        {   
            this.debugPath += "\\bin\\AdvplDebugBridge.exe";
        }
             
        
    }
    public runUnitTest(source :string )
    {
        var name = path.basename(source);
        name = name.replace(/\.[^/.]+$/, "");
            var _args = new Array<string>();
        var that = this;        
        _args.push("--compileInfo=" + this.EnvInfos);
        _args.push("--testcase="+name);
        
        var child = child_process.spawn(this.debugPath,_args);
        child.stdout.on("data",function(data){
      
           that._result += data+"";
        });
        
        child.on("exit",function(data){            
            var lRunned = data == 0            
            if(lRunned)            
            {
                console.log("exit: " + data);
                console.log("exit: " +that._result);
                
                try{
                    var obj = JSON.parse(that._result);
                    that.process_result(obj);
                }
                catch (ex)
                {
                 console.log("parse error")   ;
                }
                
            }
            
            that.afterExec();
           //that.outChannel.log("ID:"+that._lastAppreMsg);
            //vscode.window.showInformationMessage("ID:"+that._lastAppreMsg);
           
        });        
        
    }

    public process_result(obj)
    {
        var nMetodos = obj.methods;
        this.testResult = obj;
        console.log("process_result");        
    }
    public getResult()
    {
        return this.testResult;
    }
    public setAfterExec(func)
    {
        this.afterExec = func;
    }
}
