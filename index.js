/* eslint-env node */
/* eslint no-unused-vars:[2, {"vars": "all", "args": "none"}] */

"use strict";

// var util = require("babel-core/lib/util");
var t = require("babel-core/lib/types");
var EXPORT_NAME = "__export__";

module.exports = ModuleFormatter;

function ModuleFormatter() {}

ModuleFormatter.prototype.transform = function (ast) {
  // this is ran after all transformers have had their turn at modifying the ast
  // feel free to modify this however
  var originalBody = ast.body;

  // var __export__ = {};
  var exportDeclaration = t.variableDeclaration("var", [t.variableDeclarator(t.identifier(EXPORT_NAME), t.objectExpression([]))]);

  // if (typeof define === 'undefined') { var define = function (cb) { cb(require, exports, module); } }
  var ifNotDefineCondition = t.binaryExpression("===", t.unaryExpression("typeof", t.identifier("define")), t.literal("undefined"));
  var ifNotDefineCall = t.expressionStatement(t.callExpression(t.identifier("cb"), [t.identifier("require"),t.identifier("exports"),t.identifier("module")]));
  var ifNotDefineFunc = t.functionDeclaration(null, [t.identifier("cb")], t.blockStatement([ifNotDefineCall]));
  var ifNotDefineContent = t.variableDeclaration("var", [t.variableDeclarator(t.identifier("define"), ifNotDefineFunc)]);
  var ifNotDefine = t.ifStatement(ifNotDefineCondition, t.blockStatement([ifNotDefineContent]));

  // require, exports, module
  var params = [
    t.identifier("require"),
    t.identifier("exports"),
    t.identifier("module")
  ];

  // function (require, exports, module) { ... }
  var container = t.functionExpression(null, params, t.blockStatement(originalBody));

  // define(function (require, exports, module) { ... });
  var defineCall = t.callExpression(t.identifier("define"), [container]);

  // module.exports = __export__;
  var moduleExports = t.memberExpression(t.identifier("module"), t.identifier("exports"));
  var moduleExportsAssign = t.assignmentExpression("=", moduleExports, t.identifier(EXPORT_NAME));
  originalBody.push(t.expressionStatement(moduleExportsAssign));

  // assign a new body to the ast
  ast.body = [ifNotDefine, exportDeclaration, t.expressionStatement(defineCall)];
};

ModuleFormatter.prototype.importDeclaration = function (node, nodes) {
  // node is an ImportDeclaration
  var ref = t.callExpression(t.identifier("require"), [node.source]);
  nodes.push(t.expressionStatement(ref));
};

ModuleFormatter.prototype.importSpecifier = function (specifier, node, nodes) {
  // specifier is an ImportSpecifier
  // node is an ImportDeclaration
  var ref = t.callExpression(t.identifier("require"), [node.source]);
  if (specifier.imported) {
    ref = t.memberExpression(ref, specifier.imported);
  }
  nodes.push(t.variableDeclaration("var", [t.variableDeclarator(specifier.local, ref)]));
};

ModuleFormatter.prototype.exportDeclaration = function (node, nodes) {
  // node is an ExportDeclaration
  if (node.declaration) {
    var assign = t.assignmentExpression("=", t.identifier(EXPORT_NAME), node.declaration);
    nodes.push(t.expressionStatement(assign));
  }
};

ModuleFormatter.prototype.exportSpecifier = function (specifier, node, nodes) {
  // specifier is an ExportSpecifier
  // node is an ExportDeclaration
  if (specifier.exported) {
    var left = t.memberExpression(t.identifier(EXPORT_NAME), specifier.exported);
    var assign = t.assignmentExpression("=", left, specifier.local);
    nodes.push(t.expressionStatement(assign));
  }
};
