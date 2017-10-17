
import { getMessage, Status, Report } from './util';



export const config = 
{
    CONFIG_SECTION_KEY: 'advpl-unit-test',
    OUTPUT_CHANNEL_NAME: 'Advpl-Unit-Test',

    FAILING_COLOUR: '#ff9b9b',
    PASSING_COLOUR: '#55e269',

    ACTIVATE_ON_STARTUP: { name: 'activateOnStartup', defaultValue: true },
    TEST_SCRIPT: { name: 'testScript', defaultValue: 'test' },
    GLOB: { name: 'glob', defaultValue: '{test,src}/**/*.{js,ts,jsx,tsx}' },
    REPORTER: { name: 'reporter', defaultValue: null },
    VERBOSE: { name: 'verbose', defaultValue: false },
    MINIMAL: { name: 'minimal', defaultValue: false },
    BUILD_ON_ACTIVATION: { name: 'buildOnActivation', defaultValue: false },
    BUILD_ON_CREATE: { name: 'buildOnCreate', defaultValue: false },
    BUILD_ON_DELETE: { name: 'buildOnDelete', defaultValue: false },
    SHOW_COVERAGE: { name: 'showCoverage', defaultValue: false },
    COVERAGE_THRESHOLD: { name: 'coverageThreshold', defaultValue: null }
}

export const commands = {
    ACTIVATE: 'nodeTdd.activate',
    DEACTIVATE: 'nodeTdd.deactivate',
    TOGGLE_OUTPUT: 'nodeTdd.toggleOutput',
    STOP_BUILD: 'nodeTdd.stopBuild',
};

export const messages = {
    ACTIVATE_EXTENSION: {
        text: 'Advpl UT $(rocket)',
        tooltip: 'Deactivate Advpl UT mode',
        command: commands.DEACTIVATE,
    },

    DEACTIVATE_EXTENSION: {
        text: 'Advpl UT $(circle-slash)',
        tooltip: 'Activate Advpl Unit Test mode',
        command: commands.ACTIVATE,
    },

    failing: async function (minimal: boolean, report?: Report) {
        const message = await getMessage(Status.FAILING, minimal, report);

        return {
            text: message.text,
            color: config.FAILING_COLOUR,
            tooltip: message.tooltip,
            command: commands.TOGGLE_OUTPUT
        };
    },

    FAILING_DIALOG: 'Node TDD: The build failed',

    passing: async function (minimal: boolean, report?: Report) {
        const message = await getMessage(Status.PASSING, minimal, report);

        return {
            text: message.text,
            color: config.PASSING_COLOUR,
            tooltip: message.tooltip,
            command: commands.TOGGLE_OUTPUT
        };
    },

    PASSING_DIALOG: 'Node TDD: The build passed',

    SHOW_OUTPUT_DIALOG: 'Show output',

    building: function (minimal: boolean) {
        return {
            text: minimal ? '$(tools)' : '$(tools) Building',
            color: 'inherit',
            tooltip: 'Stop current build',
            command: commands.STOP_BUILD
        };
    },

    buildStopped: function (minimal: boolean) {
        return {
            text: minimal ? '$(stop)' : 'Build stopped',
            color: 'inherit',
            tooltip: minimal ? 'Build stopped' : '',
            command: ''
        };
    },

    STOPPED_DIALOG: 'Advpl Unit Test: The build was stopped',

    OPEN_PACKAGE_JSON: 'Open package.json',

    PACKAGE_JSON_NOT_FOUND: 'Advpl Unit Test: package.json was not found',

    DEACTIVATE_DIALOG: 'Deactivate Advpl Unit Test',

    coverage: function (coverage: number, threshold: number | null, minimal: boolean) {
        return {
            text: minimal ? `${coverage}%` : `$(dashboard) ${coverage}%`,
            tooltip: 'Test coverage',
            color: threshold ? (coverage >= threshold ?
                config.PASSING_COLOUR : config.FAILING_COLOUR) : 'inherit'
        };
    },

    scriptNotFound: function (scriptName: string) {
        return `Node TDD: The npm script \`${scriptName}\` was not found`;
    }
};
