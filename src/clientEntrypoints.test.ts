import { readFileSync } from 'node:fs';
import { URL } from 'node:url';
import ts from 'typescript';
import { expect, it } from 'vitest';
import * as root from './index.js';
import * as player from './player.js';
import * as primitives from './primitives.js';

it.each(['index.tsx', 'player.ts', 'primitives.tsx'])(
  'uses a client directive and explicit runtime exports in %s',
  (filename) => {
    const source = ts.createSourceFile(
      filename,
      readFileSync(new URL(filename, import.meta.url), 'utf8'),
      ts.ScriptTarget.Latest,
    );
    const directive = source.statements[0];
    expect(ts.isExpressionStatement(directive) && ts.isStringLiteral(directive.expression)
      ? directive.expression.text
      : undefined).toBe('use client');
    const wildcardExports = source.statements.filter(statement =>
      ts.isExportDeclaration(statement) && !statement.isTypeOnly && !statement.exportClause,
    );
    expect(wildcardExports.map(statement => statement.getText(source))).toEqual([]);
  },
);

it('keeps both subpath APIs available from the root entry point', () => {
  expect({ ...root }).toEqual({ ...primitives, ...player });
});
