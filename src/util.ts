
interface Result {
    pass: number;
    count: number;
}
export enum Status {
    PASSING,
    FAILING
}

export interface Report {
    reporter: string;
    stdout: string;
}

export async function getMessage(status: Status, minimal?: boolean, report?: Report) {
    let text = '';
    let tooltip = '';
    const stats = await getStats(report);

    if (minimal) {
        if (report && stats) {
            text = stats;
        }
        else {
            text = status === Status.PASSING ? '$(check)' : '$(alert)';
        }
        tooltip = status === Status.PASSING ? 'Build passing' : 'Build failing';
    }
    else {
        text = status === Status.PASSING ? '$(check)' : '$(alert)';
        if (stats) {
            text += ' ' + stats;
        }
        else {
            text += status === Status.PASSING ? ' Passing' : ' Failing';
        }
        tooltip = 'Toggle output';
    }

    return {
        text,
        tooltip
    };
}

async function getStats(report?: Report) {
    if (report) {
        const result = await parseReport(report);
        if (result) {
            return `${result.pass}/${result.count}`;
        }
    }
}
function parseReport(report: Report) {
    if (report.reporter === 'tap') {
        return new Promise<Result>(resolve => {
         /*   const parser = new Parser();
            parser.on('complete', function (results: any) {
                resolve({
                    pass: results.pass,
                    count: results.count
                });
            });
            parser.end(report.stdout);*/
        });
    }
}