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
  // save the original body
  var body = ast.body;
  // put together params for the wrapper function
  var params = [
    t.identifier("require"),
    t.identifier("exports"),
    t.identifier("module")
  ];
  // exports object
  var exportObj = t.variableDeclaration("var", [t.variableDeclarator(t.identifier(EXPORT_NAME), t.objectExpression([]))]);
  body.unshift(exportObj);
  var moduleExports = t.memberExpression(t.identifier("module"), t.identifier("exports"));
  var moduleExportsAssign = t.assignmentExpression("=", moduleExports, t.identifier(EXPORT_NAME));
  body.push(t.expressionStatement(moduleExportsAssign));
  // wrap the original body in a function
  var container = t.functionExpression(null, params, t.blockStatement(body));
  // make a define call with the wrapper body
  var call = t.callExpression(t.identifier("define"), [container]);
  // assign a new body to the ast
  ast.body = [t.expressionStatement(call)];
};

ModuleFormatter.prototype.importDeclaration = function (node, nodes) {
  // node is an ImportDeclaration
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
