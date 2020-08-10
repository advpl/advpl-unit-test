import * as child_process from 'child_process';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {LCov} from "coverage";

export class AdvplRunner {
    private EnvInfos :string;
    private debugPath : string;
    private consoleReturn : string;
    public _result : string;
    private afterExec;    
    private testResult;    
    private lcov: LCov;

    constructor(jSonInfos : string )
    {
        let isAlpha: boolean = vscode.workspace.getConfiguration("advpl").get<boolean>("alpha_compile");
        this.EnvInfos = jSonInfos;
        this.debugPath = vscode.extensions.getExtension("KillerAll.advpl-vscode").extensionPath;
        this._result = "";
        if(process.platform == "win32")
        {
            if(isAlpha) {
                this.debugPath += "\\bin\\alpha\\win\\AdvplDebugBridgeC.exe";
            }
            else {
                this.debugPath += "\\bin\\AdvplDebugBridge.exe";
            }
        }
        else
        {
            if(process.platform == "darwin") {
                this.debugPath += "/bin/alpha/mac/AdvplDebugBridgeC";
            }
            else {
                this.debugPath += "/bin/alpha/linux/AdvplDebugBridgeC";
            }
        }
             
        
    }
    public runUnitTest(source :string )
    {
        var name = path.basename(source);
        name = name.replace(/\.[^/.]+$/, "");
        let ext = path.extname(source)
        if (ext.toLocaleLowerCase()===".tlpp")
            name=path.basename(source);
        var _args = new Array<string>();
        var that = this;        
        _args.push("--compileInfo=" + this.EnvInfos);
        _args.push("--testcase="+name);
        
        this._result = "";
        var child = child_process.spawn(this.debugPath,_args);
        child.stdout.on("data",function(data){
      
           that._result += data+"";
        });
        
        child.on("exit",function(data){            
            var lRunned = data == 0            
            if(lRunned)            
            {
                console.log("exit: " + data);
                console.log("exit: " + that._result);
                
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

    public runFolderTest(folder :string )
    {
        var _args = new Array<string>();
        var that = this;        
        _args.push("--compileInfo=" + this.EnvInfos);
        _args.push("--testrunfolder="+folder);
        
        var child = child_process.spawn(this.debugPath,_args);
        child.stdout.on("data",function(data){
            console.log("DATA STDOUT")
           that._result += data+"";
        });

        child.stdout.on("end",() => console.log("END STDOUT"))
        
        child.on("exit",function(data){            
            var lRunned = data == 0   
            console.log("EXIT CHILD")         
            if(lRunned)            
            {
                console.log("exit: " + data);
                console.log("exit: " + that._result);
                
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
        this.testResult = obj.tests;
        this.lcov = <LCov> obj.lcov;
        console.log(obj.lcov);
        console.log("process_result");
    }

    public getCoverage() :LCov {
        return this.lcov;
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