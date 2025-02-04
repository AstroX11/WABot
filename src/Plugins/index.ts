interface Command {
    pattern: RegExp;
    function: (args: any) => Promise<any> | any;
    public: boolean;
    isGroup: boolean;
    dontAddCommandList: boolean;
}

interface CommandInput {
    pattern: string;
    public?: boolean;
    isGroup?: boolean;
    dontAddCommandList?: boolean;
}

const commands: Command[] = [];

const Module = function(cmd: CommandInput, func: Command['function']): Command {
    const command: Command = {
        function: func,
        pattern: new RegExp(`^\\s*(${cmd.pattern})(?:\\s+([\\s\\S]+))?$`, 'i'),
        public: cmd.public ?? false,
        isGroup: cmd.isGroup ?? false,
        dontAddCommandList: cmd.dontAddCommandList ?? false
    };
    
    commands.push(command);
    return command;
};

export { Module, Command, CommandInput, commands };