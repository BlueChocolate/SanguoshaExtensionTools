import * as lua from 'luaparse';

export abstract class LuaAstHelper {
    /**
     * 解析 Lua 源代码（版本 5.2），返回抽象语法树（AST）
     * @param luaRaw Lua源代码字符串
     * @returns AST 的 JSON 对象
     */
    static parse(luaRaw: string): lua.Chunk {
        // luaparse 可用的选项
        // wait: false输入结束时明确告诉解析器。
        // comments: true将评论作为数组存储在块对象中。
        // scope: false跟踪标识符范围。
        // locations: false在每个语法节点上存储位置信息。
        // ranges: false在每个语法节点上存储开始和结束字符位置。
        // onCreateNode: null语法节点完成时将调用的回调。已创建的节点将作为唯一参数传递。
        // onCreateScope: null创建新范围时将调用的回调。
        // onDestroyScope: null当前范围被销毁时将调用的回调。
        // onLocalDeclaration: null声明局部变量时将调用的回调。标识符将作为唯一参数传递。
        // luaVersion: '5.1'解析器将针对的 Lua 版本；支持的值为'5.1'、'5.2'和。'5.3''LuaJIT'
        // extendedIdentifiers: false是否像 LuaJIT 那样在标识符中允许代码点≥ U+0080。注意：设置luaVersion: 'LuaJIT' 目前不启用该选项；这可能会在未来改变。
        // encodingMode: 'none'定义了解析器输入中出现的大于等于 U+0080 的代码点与源代码中的原始字节之间的关系，以及应如何解释 JavaScript 字符串中的 Lua 转义序列。
        const ast = lua.parse(luaRaw, { scope: true, locations: true, ranges: true, luaVersion: '5.2' });
        return ast;
    }

    // 有点没看懂
    static rebuildTree(node: any, visit: any) {
        if (!node) { return; }

        node = Object.assign({}, node);
        visit(node);

        function visitKey(key: any) {
            if (!node[key]) { return; }

            if (Array.isArray(node[key])) {
                node[key] = node[key].map(function (item: any) {
                    return LuaAstHelper.rebuildTree(item, visit);
                });
            } else { node[key] = LuaAstHelper.rebuildTree(node[key], visit); }
        }

        switch (node['type']) {
            case 'LocalStatement':
            case 'AssignmentStatement':
                visitKey('variables');
                visitKey('init');
                break;
            case 'UnaryExpression':
                visitKey('argument');
                break;
            case 'BinaryExpression':
            case 'LogicalExpression':
                visitKey('left');
                visitKey('right');
                break;
            case 'FunctionDeclaration':
                visitKey('identifier');
                visitKey('parameters');
                visitKey('body');
                break;
            case 'ForGenericStatement':
                visitKey('variables');
                visitKey('iterators');
                visitKey('body');
                break;
            case 'IfClause':
            case 'ElseifClause':
            case 'WhileStatement':
            case 'RepeatStatement':
                visitKey('condition');
            /* fall through */
            case 'Chunk':
            case 'ElseClause':
            case 'DoStatement':
                visitKey('body');
                visitKey('globals');
                visitKey('comments');
                break;
            case 'ForNumericStatement':
                visitKey('variable');
                visitKey('start');
                visitKey('end');
                visitKey('step');
                visitKey('body');
                break;
            case 'ReturnStatement':
                visitKey('arguments');
                break;
            case 'IfStatement':
                visitKey('clauses');
                break;
            case 'MemberExpression':
                visitKey('base');
                visitKey('identifier');
                break;
            case 'IndexExpression':
                visitKey('base');
                visitKey('index');
                break;
            case 'LabelStatement':
                visitKey('label');
                break;
            case 'CallStatement':
                visitKey('expression');
                break;
            case 'GotoStatement':
                visitKey('label');
                break;
            case 'TableConstructorExpression':
                visitKey('fields');
                break;
            case 'TableKey':
            case 'TableKeyString':
                visitKey('key');
            /* fall through */
            case 'TableValue':
                visitKey('value');
                break;
            case 'CallExpression':
                visitKey('base');
                visitKey('arguments');
                break;
            case 'TableCallExpression':
                visitKey('arguments');
            /* fall through */
            case 'StringCallExpression':
                visitKey('base');
                visitKey('argument');
                break;
            case 'Identifier':
            case 'NumericLiteral':
            case 'BooleanLiteral':
            case 'StringLiteral':
            case 'NilLiteral':
            case 'VarargLiteral':
            case 'BreakStatement':
            case 'Comment':
                break;
            default:
                throw new Error('Unhandled ' + node['type']);
        }

        return node;
    }

    /**
     * 将 AST 转换为源码 
     * @param node AST 的 JSON 对象
     * @returns AST 对应的源码（删除了注释）
     */
    static astToSource(node: any): string {
        if (!node) { return ''; }

        function visitKey(key: string, separator: string = ''): string {
            if (!node[key]) { return ''; }

            let source = '';

            if (Array.isArray(node[key])) {
                source += LuaAstHelper.astToSource(node[key][0]);
                for (let i = 1; i < node[key].length; i++) { source += separator + LuaAstHelper.astToSource(node[key][i]); }
            } else {
                source = LuaAstHelper.astToSource(node[key]);
            }

            return source;
        }

        switch (node['type']) {
            case 'LocalStatement':
                return 'local ' + visitKey('variables', ',') + '=' + visitKey('init', ',');
            case 'AssignmentStatement':
                return visitKey('variables', ',') + '=' + visitKey('init', ',');
            case 'UnaryExpression':
                return node['operator'] + ' ' + visitKey('argument');
            case 'BinaryExpression':
            case 'LogicalExpression':
                return visitKey('left') + ' ' + node['operator'] + ' ' + visitKey('right');
            case 'FunctionDeclaration':
                return node['isLocal'] ? 'local ' : '' + 'function' + visitKey('identifier') + '(' + visitKey('parameters', ',') + ')\n' + visitKey('body', '\n') + '\nend';
            case 'ForGenericStatement':
                return 'for ' + visitKey('variables', ',') + ' in ' + visitKey('iterators', ',') + 'do\n' + visitKey('body', '\n') + '\nend';
            case 'IfClause':
                return 'if ' + visitKey('condition') + ' then\n' + visitKey('body', '\n');
            case 'ElseifClause':
                return 'elseif ' + visitKey('condition') + ' then\n' + visitKey('body', '\n');
            case 'WhileStatement':
                return 'while ' + visitKey('condition') + ' then\n' + visitKey('body', '\n') + '\nend';
            case 'RepeatStatement':
                return 'repeat\n' + visitKey('body', '\n') + '\nuntil ' + visitKey('condition');

            /* fall through */
            case 'Chunk':
                return visitKey('body', '\n');
            // visitKey('globals');
            // visitKey('comments');
            case 'ElseClause':
                return 'else' + visitKey('body', '\n') + '\n';
            case 'DoStatement':
                return 'do\n' + visitKey('body', '\n') + '\nend';
            case 'ForNumericStatement':
                return 'for ' + visitKey('variable', ',') + '=' + visitKey('start') + ',' + visitKey('end') + ',' + visitKey('step') + ' do\n' + visitKey('body', '\n') + '\nend';
            case 'ReturnStatement': // !已验证
                return 'return ' + visitKey('arguments', ',');
            case 'IfStatement':
                return visitKey('clauses', '\n') + '\nend';
            case 'MemberExpression':
                return visitKey('base') + node['indexer'] + visitKey('identifier');
            case 'IndexExpression':
                return visitKey('base') + '[' + visitKey('index') + ']';
            case 'LabelStatement':
                return visitKey('label');
            case 'CallStatement': // !已验证
                return visitKey('expression');
            case 'GotoStatement':
                return 'goto ' + visitKey('label');
            case 'TableConstructorExpression':
                if (node['fields'].length <= 3 && (node['fields'] as []).every(f => { return f['type'] === 'TableValue'; })) {
                    return '{ ' + visitKey('fields', ',') + '}';
                } else {
                    return '{\n' + visitKey('fields', ',\n') + '\n}';
                }

            case 'TableKey':
                return '[' + visitKey('key') + ']' + '=' + visitKey('value');
            case 'TableKeyString':
                return visitKey('key') + '=' + visitKey('value');


            /* fall through */
            case 'TableValue':
                return visitKey('value');
            case 'CallExpression':
                return visitKey('base') + '(' + visitKey('arguments', ',') + ')';
            case 'TableCallExpression':
                return visitKey('base') + visitKey('arguments', '\n');
            /* fall through */
            case 'StringCallExpression': // ? 这是啥
                visitKey('base');
                visitKey('argument');
                break;
            case 'Identifier':
                return node['name'];
            case 'NumericLiteral':
            case 'BooleanLiteral':
            case 'StringLiteral':
                return node['raw'];
            case 'NilLiteral':
                return 'nil';
            case 'VarargLiteral':
                return '???VarargLiteral???';
            case 'BreakStatement':
                return 'break';
            case 'Comment':
                return node['raw'];
            default:
                throw new Error('Unhandled ' + node['type']);
        }
        return '';
    }

    // 获取成对的赋值语句，因为lua可以这样写：a,b=123,"success"
    static readAssignmentStatement(ast: any) {
        let assignations = [];
        if (ast['type'] === 'AssignmentStatement') {
            const vars = ast['variables']; // 数组
            const inits = ast['init']; // 数组

            const max: number = vars.length < inits.length ? vars.length : inits.length;

            for (let i = 0; i < max; i++) {
                assignations.push({ to: vars[i], from: inits[i] });
            }
            return { assignations: assignations, range: ast['range'] as number[], loc: ast['loc'] as { start: { line: number; column: number; }; end: { line: number; column: number; }; } };
        }
        return undefined;
    }

    // 获取形如 sgs.Abc(a,123,"cd") 的函数调用的参数信息
    static readSgsCallExpression(ast: any) {
        let name: string;
        let args: any[];
        if (ast['type'] === 'CallExpression') {

            if (ast['base']['type'] === 'MemberExpression') {

                if (ast['base']['identifier']['type'] === 'Identifier'
                    && ast['base']['base']['type'] === 'Identifier') {

                    if (ast['base']['indexer'] === '.'
                        && ast['base']['base']['name'] === 'sgs') {

                        // 获取函数名称
                        name = ast['base']['identifier']['name'];

                        // 获取函数的参数
                        args = ast['arguments'];

                        return { name: name, args: args, range: ast['range'] as [] };
                    }
                }
            }
        }
        return undefined;
    }

    // 获取形如 sgs.LoadTranslationTable{} 的调用语句
    static readSgsTableCallExpression(ast: any) {
        let name: string;
        let args: any[];
        if (ast['type'] === 'TableCallExpression') {

            if (ast['base']['type'] === 'MemberExpression'
                && ast['arguments']['type'] === 'TableConstructorExpression') {

                if (ast['base']['indexer'] === '.'
                    && ast['base']['identifier']['type'] === 'Identifier'
                    && ast['base']['base']['type'] === 'Identifier') {

                    if (ast['base']['base']['name'] === 'sgs') {

                        // 获取函数名称
                        name = ast['base']['identifier']['name'];

                        // 获取函数的参数（TableKey）
                        args = ast['arguments']['fields'];

                        return { name: name, args: args as [], range: ast['range'] as [] };
                    }
                }
            }
        }
        return undefined;
    }

    // 获取形如 sgs.ABC_DEF 的成员表达式信息
    static readSgsMemberExpression(ast: any) {
        if (ast['type'] === 'MemberExpression') {

            if (ast['indexer'] === '.'
                && ast['identifier']['type'] === 'Identifier'
                && ast['base']['type'] === 'Identifier') {

                // 判断调用的是不是形如 sgs.Package_CardPack
                if (ast['base']['name'] === 'sgs') {
                    return { name: ast['identifier']['name'] as string, range: ast['range'] as [] };
                }
            }
        }
        return undefined;
    }

    // 读取 TableKey 与 TableKeyString
    static readTableKeyOrTableKeyString(ast: any) {
        if (ast['type'] === 'TableKey' || ast['type'] === 'TableKeyString') {

            return { key: ast['key'], value: ast['value'], range: ast['range'] as [] };
        }
        return undefined;
    }

    // 获取字符串
    static readStringLiteral(ast: any) {
        if (ast['type'] === 'StringLiteral') {
            return { raw: ast['raw'], range: ast['range'] as [] };
        }
    }

    // 获取数字
    static readNumericLiteral(ast: any) {
        if (ast['type'] === 'NumericLiteral') {
            return { raw: ast['raw'] as number, range: ast['range'] as [] };
        }
    }

    // 获取布尔
    static readBooleanLiteral(ast: any) {
        if (ast['type'] === 'BooleanLiteral') {
            return { raw: ast['raw'] as boolean, range: ast['range'] as [] };
        }
    }

    // 获取标识符
    static readIdentifier(ast: any) {
        if (ast['type'] === 'Identifier') {
            return { name: ast['name'], range: ast['range'] as [] };
        }
    }
}

export abstract class JsAstHelper {
}