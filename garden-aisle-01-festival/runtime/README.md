# Runtime fragments

`app.js` が `part-01.jsfrag` から `part-09.jsfrag` を順番に読み、連結して実行します。

GitHub Contents APIで扱いやすくするための物理分割であり、論理的には単一のIIFEです。任意の断片だけを直接実行しないでください。変更後は全断片を連結し、`node --check` と `tests/webgl-stub.js` を実行します。
