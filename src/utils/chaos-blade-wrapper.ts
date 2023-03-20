import {exec} from "child_process";

class ChaosBladeWrapper {
    constructor(private chaosBladePath: string = "blade"){}
    private executeCommand(command: string): Promise<string> {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout || stderr);
                }
            });
        });
    }
    public async createExperiment(experiment: string):Promise<string> {
        const command = `${this.chaosBladePath} create ${experiment}`;
        return this.executeCommand(command);
    }
    public async getStatus(uid: string):Promise<string> {
        const command = `${this.chaosBladePath} status ${uid}`;
        return this.executeCommand(command);
    }
    public async destroyExperiment(uid: string):Promise<string> {
        const command = `${this.chaosBladePath} destroy ${uid}`;
        return this.executeCommand(command);
    }
}

export default ChaosBladeWrapper;