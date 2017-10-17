
import { StatusBarItem, window, workspace, OutputChannel, StatusBarAlignment } from 'vscode';
import { messages, config } from './constants';
let instance: AdvplUnitTest;
interface Config<T> 
{
    name: string;
    defaultValue: T;
}

export class AdvplUnitTest 
{
    private enabled = false;
    private outputShown = true;
    private extensionStatusBar: StatusBarItem;
    private buildStatusBar: StatusBarItem;
    private coverageStatusBar: StatusBarItem;
    private outputChannel: OutputChannel;

     static getConfig<T>(configSection: Config<T>) {
        return workspace.getConfiguration(config.CONFIG_SECTION_KEY)
            .get<T>(configSection.name, configSection.defaultValue);
    }
    
    static getInstance() 
    {
        if (!instance) 
        {
            instance = new AdvplUnitTest();
        }
        return instance;
    }

     private constructor() {
        if (workspace.rootPath) {
            this.outputChannel = window.createOutputChannel(config.OUTPUT_CHANNEL_NAME);
            //this.testRunner = new TestRunner();

            this.extensionStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 2);
            this.buildStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 1);
            this.coverageStatusBar = window.createStatusBarItem(StatusBarAlignment.Left, 0);

            const activateOnStartup = true; //NodeTDD.getConfig<boolean>(config.ACTIVATE_ON_STARTUP);

            if (activateOnStartup) {
                this.activate();
            }
            else {
                this.deactivate();
            }

            this.extensionStatusBar.show();
        }
    }
    activate() {
        this.enabled = true;
        this.showBuildStatusBar();
        Object.assign(this.extensionStatusBar, messages.ACTIVATE_EXTENSION);
        //this.testRunner.watch();
        this.showCoverageStatusBar();
    }

    deactivate() {
        this.enabled = false;
        this.hideBuildStatusBar();
        this.hideCoverageStatusBar();
        Object.assign(this.extensionStatusBar, messages.DEACTIVATE_EXTENSION);
        //this.testRunner.dispose();
    }
    setBuildStatusBar(obj: Partial<StatusBarItem>) 
    {
        Object.assign(this.buildStatusBar, obj);
    }
 showBuildStatusBar() {
        this.buildStatusBar.show();
    }

    hideBuildStatusBar() {
        this.buildStatusBar.hide();
    }

    clearOutput() {
        this.outputChannel.clear();
    }

    hideOutput() {
        this.outputChannel.hide();
        this.outputShown = false;
    }

    toggleOutput() {
        if (this.outputShown) {
            this.outputChannel.hide();
        }
        else {
            this.outputChannel.show();
        }

        this.outputShown = !this.outputShown;
    }

    appendOutput(text: string) {
        this.outputChannel.append(text);
    }

    stopBuild() {
      //  this.testRunner.stop();
    }

    async showInfoDialog(code: number | null) {
        if (!AdvplUnitTest.getConfig<boolean>(config.VERBOSE)) {
            return;
        }

        let clicked;

        if (code === 0) {
            clicked = await window.showInformationMessage(
                messages.PASSING_DIALOG, messages.SHOW_OUTPUT_DIALOG);
        }
        else if (code === 1) {
            clicked = await window.showErrorMessage(
                messages.FAILING_DIALOG, messages.SHOW_OUTPUT_DIALOG);
        }
        else if (code === null) {
            window.showWarningMessage(messages.STOPPED_DIALOG);
        }

        if (clicked && clicked === messages.SHOW_OUTPUT_DIALOG) {
            this.outputChannel.show();
            this.outputShown = true;
        }
    }

    setCoverage(coverage?: number) {
        if (coverage) {            
            const threshold = AdvplUnitTest.getConfig<number | null>(config.COVERAGE_THRESHOLD);
            const minimal = AdvplUnitTest.getConfig<boolean>(config.MINIMAL);
            Object.assign(this.coverageStatusBar, messages.coverage(coverage, threshold, minimal));
        }
    }

    clearCoverage() {
        this.coverageStatusBar.text = '';
    }

    hideCoverageStatusBar() {
        this.coverageStatusBar.hide();
    }

    showCoverageStatusBar() {
        //if (NodeTDD.getConfig<boolean>(config.SHOW_COVERAGE) && this.coverageStatusBar.text) {
        if (this.coverageStatusBar.text) {
            this.coverageStatusBar.show();
        }
    }

    dispose() {
        this.extensionStatusBar.dispose();
        this.buildStatusBar.dispose();
        this.coverageStatusBar.dispose();
        this.outputChannel.dispose();
        //this.testRunner.dispose();
    }
    
}