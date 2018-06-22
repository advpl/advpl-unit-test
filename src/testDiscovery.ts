import * as fs from "fs";
import * as path from "path";

export interface IDiscoverTestsResult {
    testNames: string[];
    warningMessage?: string;
}

export function discoverTests(testDirectoryPath: string ): Promise<IDiscoverTestsResult> {
    
    return Promise.resolve({
        testNames: walkSync(testDirectoryPath)
    })
}

function walkSync (dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        try {
            filelist = walkSync(dirFile, filelist);
        }
        catch (err) {
            if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, file];
            else throw err;
        }
    });
    return filelist;
}