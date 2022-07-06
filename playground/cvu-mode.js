"use strict";

var ace = require("ace-builds")
require("ace-builds/src-noconflict/mode-javascript");

var oop = ace.require("ace/lib/oop");
var TextMode = ace.require("ace/mode/text").Mode;
var FoldMode = ace.require("ace/mode/folding/cstyle").FoldMode;
var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;
var CstyleBehaviour = ace.require("ace/mode/behaviour/cstyle").CstyleBehaviour;
var MatchingBraceOutdent = ace.require("ace/mode/matching_brace_outdent").MatchingBraceOutdent;

var CvuHighlightRules = function() {
    var keywordMapper = this.createKeywordMapper({
        "constant.language":
            "false|Infinity|NaN|nil|no|null|null|off|on|super|this|true|undefined|yes",
        "support.type":
            "left|top|right|bottom|center|lefttop|topleft|topright|righttop|leftbottom|bottomleft|rightbottom|bottomright",
        "support.constant":
            "regular|bold|semibold|heavy|light|ultralight|black|fit|fill",
        "storage.type":
            "VStack|HStack|ZStack|Button|FlowStack|Text|SubView|Image|Circle|HorizontalLine|Rectangle|" +
            "Spacer|Divider|Empty|ActionButton|DropZone|Wrap|Dropdown|RichText|LoadingIndicator",
        "keyword":
            "and|AND|or|OR|equals|EQUALS|not|NOT|"+
            "datasource|view|filter|openLink|"+
            "copytoclipboard"
    }, "identifier", true);

    var propertyKeywords = "\\b(showtimeline|currentSessionIndex|textalign|sessionDefinitions|name|currentViewIndex|viewDefinitions|editMode|showFilterPanel|" +
        "showContextPane|screenshot|emptyResultText|title|subTitle|filterText|activeRenderer|defaultRenderer|backTitle|searchHint|" +
        "userState|datasourceDefinition|viewArguments|showLabels|actionButton|editActionButton|sortFields|editButtons|filterButtons|" +
        "actionItems|navigateItems|contextButtons|include|renderDefinitions|light|dark|border|color|background|sequence|excluded|readOnly|" +
        "starred|foreach|show|text|list|press|arguments|memriID|cornerRadius|font|padding|sectionTitle|alignment|maxChar|sharewith|" +
        "addtolist|duplicate|timelineof|all|icon|view|query|sortProperty|sortAscending|timeProperty|fromTemplate|profilePicture|names|" +
        "picturesOfPerson|minHeight|toolbar|columns|itemInset|searchbar|readonly|image|resizable|maxHeight|opacity|align|maxWidth|condition|" +
        "template|type|dates|empty|value|defaultValue|country|address|margin|edge|hierarchy|nopadding|hint|emptyValue|location|rendererNames|" +
        "subject|property|textAlign|slideLeftActions|longPress|spacing|systemName|rowInset|removeWhiteSpace|default|optionsFromQuery|importer|" +
        "minWidth|bundleImage|groups|iconHeading|run|importerInstance|indexer|description|bold|dataItem|renderers|uid|edgeInset|" +
        "hSpacing|slideRightActions|debug|italic|underline|strikethrough|viewName|style|blur|zindex|rowbackground|frame|cornerborder|shadow|" +
        "offset|highlight|lightInputText|inputText|activeColor|activeBackgroundColor|inactiveColor|inactiveBackgroundColor|renderAs|showTitle|" +
        "opensView|width|height|isLink|onPress|scrollable|item|isVector|sizingMode|edgeType|distinct|rows|styleName|showSearchBar|showBottomBar|showTopBar|" +
        "openNewView|propertyName|singleChoice|id|_type|lineLimit|filter|properties|itemType|edgeSources|content|file|" +
        "inheritDatasource|cornerRadiusOnly|sort|targetType|edgeTarget|clearStack|cols|pageLabel|isReverse|hideSeparators|edgeTargets|" +
        "topBarColor|additional|edgeSource|emptyResult|pages|datasource|renderer|src|seconds|container|pluginModule|pluginName|pluginId|" +
        "count|actions|items|secure|plugin|targetItemId|showDefaultSelections|layout|speed|size|spans|forceUpdate|features|addPageIfMissing|trailingElement|"+
        "datasources|isCollapsed|error|expression|initialItem|groupBy|selectedItems|removePrevious|dataset|edgeName|onChange|inPreviewMode|"+
        "project|url|buttons|overrideResetAction|customDefinition|startingElement|clearPageControllers" +
        ")(?=\\b\\s*:)";

    var parensMap = {
        "}": "{",
        "]": "["
    };

    // regexp must not have capturing parentheses. Use (?:) instead.
    // regexps are ordered -> the first match is used
    this.$rules = {
        "start": [
            {include: "commentOpen"},
            {include: "selectorBlockOpen"},
            {
                token: "paren.lparen",
                regex: /[[{]/,
                next: "innerBlock",
                onMatch: function (value, currentState, stack) {
                    stack.unshift(this.next, value, currentState);
                    return this.token;
                },
            }, {
                token: "paren.lparen",
                regex: /[(]/
            }, {
                token: "paren.rparen",
                regex: /[)]/
            }, {
                token: "text",
                regex: /\s+/
            },
        ],
        "innerBlock": [
            {include: "commentOpen"},
            {include: "selectorBlockOpen"},
            {
                token: "paren.lparen",
                regex: /{{/,
                push: "expressions",
            },
            {
                token: "paren.lparen",
                regex: /[[{]/,
                next: "innerBlock",
                onMatch: function (value, currentState, stack) {
                    stack.unshift(this.next, value, currentState);
                    return this.token;
                },
            }, {
                token: "paren.rparen",
                regex: /[}\]]/,
                next: "start",
                onMatch: function (value, currentState, stack) {
                    if (parensMap[value] == stack[1]) {
                        stack.shift();
                        stack.shift();
                        this.next = stack.shift();
                    } else {
                        this.next = '';
                    }
                    return this.token;
                }
            }, {
                token: "variable",
                regex: propertyKeywords,
                caseInsensitive: true,
            },
            {
                include: "expressions"
            }
        ],
        "selectorBlockOpen": [
            {
                token: ["paren.lparen", "keyword"],
                regex: /(\[)(?:\s*)(sessions|session|renderer|datasource|color|style|language|view)/,
                push: "selectorBlock"
            },
        ],
        "selectorBlock": [
            {
                token: "paren.rparen",
                regex: /]/,
                next: "pop"
            }, {
                token: "keyword.operator",
                regex: /[=]/
            }, {
                include: "stringOpen"
            },
        ],
        "stringOpen": [
            {
                token: "string",
                regex: /["']/,
                next: "string",
                onMatch: function (value, currentState, stack) {
                    stack.unshift(this.next, value, currentState);
                    return this.token;
                },
            }
        ],
        "multilineStringOpen": [
            {
                token: "string",
                regex: /'{3}/,
                next: "multilineString",
                onMatch: function (value, currentState, stack) {
                    stack.unshift(this.next, value, currentState);
                    return this.token;
                },
            }
        ],
        "multilineString": [
            {
                token: "string",
                regex: /'{3}/,
                next: "start",
                onMatch: function (value, currentState, stack) {
                    if (value == stack[1]) {
                        stack.shift();
                        stack.shift();
                        this.next = stack.shift();
                    } else {
                        this.next = '';
                    }
                    return this.token;
                },
            }, {
                defaultToken: "string"
            }
        ],
        "string": [
            {
                token: "constant.language.escape",
                regex: /\\(?:x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|['"\\\/bfnrt])/
            }, {
                token: "string",
                regex: /{/,
                push: "expressions",
            }, {
                token: "string",
                regex: /["']/,
                next: "start",
                onMatch: function (value, currentState, stack) {
                    if (value == stack[1]) {
                        stack.shift();
                        stack.shift();
                        this.next = stack.shift();
                    } else {
                        this.next = '';
                    }
                    return this.token;
                },
            }, {
                defaultToken: "string"
            }
        ],
        "commentOpen": [
            {
                token: "comment.start",
                regex: /\/\*/,
                push: "comment"
            },
        ],
        "comment": [
            {
                token: "comment.end",
                regex: /\*\//,
                next: "pop"
            }, {
                defaultToken: "comment"
            }
        ],
        "expressions": [
            {
                include: "stringOpen"
            },
            {
                token: "constant.numeric", // hex
                regex: /(?:0[xX]|#)[0-9a-fA-F]+\b/
            }, {
                token: "constant.numeric", // float
                regex: /[+-]?\d+(?:(?:\.\d*)?(?:[eE][+-]?\d+)?)?\b/
            }, {
                token: "constant.language.boolean",
                regex: /(?:[Tt]rue|[Ff]alse)\b/
            },
            {
                token: keywordMapper,
                regex: /\b\w+\b/
            }, {
                token: "keyword.operator",
                regex: /[=!+*/-]/
            }, {
                token: "punctuation.operator",
                regex: /[?:.,;]/
            },
            {
                token: "paren.lparen",
                regex: /\(/
            }, {
                token: "paren.rparen",
                regex: /\)/
            },
            {
                token: "paren.rparen",
                regex: /}}/,
                onMatch: function (value, currentState, stack) {
                    if (stack[0] == "expressions") {
                        stack.shift();
                        this.next = stack.shift();
                    }
                    return this.token;
                },
            },
            {
                token: "string",
                regex: /}/,
                onMatch: function (value, currentState, stack) {
                    if (stack[0] == "expressions") {
                        stack.shift();
                        this.next = stack.shift();
                    }
                    return this.token;
                },
            },
        ]
    };
    this.normalizeRules();
};

oop.inherits(CvuHighlightRules, TextHighlightRules);

exports.CvuHighlightRules = CvuHighlightRules;
 

var Mode = function() {
    this.HighlightRules = CvuHighlightRules;
    this.$behaviour = new CstyleBehaviour();
    this.foldingRules = new FoldMode();
    this.$outdent = new MatchingBraceOutdent();
};
oop.inherits(Mode, TextMode);

(function() {
    this.blockComment = { start: "/*", end: "*/" };
    this.$id = "ace/mode/cvu";

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }
        
        var match = line.match(/^.*(?:[{\[])\s*$/);
        if (match) {
            indent += tab;
        }
        

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        return this.$outdent.checkOutdent(line, input);
    };

    this.autoOutdent = function(state, doc, row) {
        this.$outdent.autoOutdent(doc, row);
    };
}).call(Mode.prototype);

exports.Mode = Mode;

