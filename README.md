# GeML: Generic Markup Language

geml-lang.org

## Example

```
{!geml 0.9}
{Obj
    <Hello World {bold <Blub {nested}>}>
    param: value
    foo: {
        bla: 1
        flag: true
        baz: "2"
        "te\"st": blub
    }

    {-test-
    Comment
    -test-}

    blaa: <test<
        \test\{test}
    >test>
    foo: <
        baz {blub}
    >
    {
        1
        2
        3
    }
}
```

## Name Finding

tyml: typed markup language (typed)
geml: Generic Markup Language (geml.org is taken. geml-lang.org?)
inmal: inline markup language

## Grammar

```
Identifier          ::= IdentifierStartChar IdentifierContChar*
IdentifierStartChar ::= '_' | unicode:ID_Start
IdentifierContChar  ::= '_' | '.' | '-' | unicode:ID_Continue

SingleLineWSChar ::= #x09 | #x20
LineBreak        ::= #x0D #x0A | #x0D | #x0A
WS               ::= SingleLineWSChar | LineBreak

Comment   ::= '{-' Delimiter '-' AnyText '-' Delimiter '-}'
Delimiter ::= unicode:ID_Continue*
AnyText   ::= .*

Trivias  ::= (WS | Comment)+

RecognizedAsGemlDocument ::= '{!geml' AnyText
Document ::= Header (Trivias? Structured)* Trivias?

Header ::= '{!geml 0.1' (Trivias HeaderAttr)* Trivias? '}'

HeaderAttr ::= PropertyName ':' Trivias? PropertyValue
PropertyName  ::= Identifier
PropertyValue ::= Value

Value ::= Primitive | String | Structured
Structured ::= Object | Array

Primitive      ::= PrimitiveChar+
PrimitiveChar  ::= IdentifierContChar | [+*=|~!?,;/\"'()^&@%$#]

String ::= SinglelineString | MultilineString | HeredocString

SinglelineString     ::= '"' (SinglelineStringChar | EscapeSequence)* '"'
SinglelineStringChar ::= . \ ('\' | '"' | LineBreak)

MultilineString     ::= '<' (MultilineStringChar | EscapeSequence | Object)* '>'
MultilineStringChar ::= . \ ('\' | '<' | '>' | '{' | '}' | LineBreak)

EscapeSequence     ::=  '\' (EscapedCR | EscapedLF | EscapedTab | EscapedSpecialChar | CodePointRef | IgnoredWS)
EscapedCR          ::= 'r'
EscapedLF          ::= 'n'
EscapedTab         ::= 't'
EscapedSpecialChar ::= [\<>{}"] | '[' | ']'
CodePointRef       ::= 'u' Hex Hex Hex Hex
Hex                ::= [0-9A-F]
IgnoredWS          ::= LineBreak SingleLineWSChar*

HeredocString ::= '<' Delimiter '<' (AnyText | '\' Delimiter EscapeSequence | '\' Delimiter '\:' Object)* '>' Delimiter '>'


Object  ::= '{' ObjectKind? (Trivias Property)* Trivias? '}'
ObjectKind ::= Identifier

Property           ::= PositionalProperty | NamedProperty
PositionalProperty ::= PropertyValue
NamedProperty      ::= PropertyName ':' Trivias? PropertyValue

Array ::= '[' (Trivias Value)* Trivias ']'

```

## Planned Tooling

-   TypeScript based parser lib. Will produce rich AST with printing/formatting/... capabilities.
-   VS Code Syntax Highlighting + Syntax Validation
-   Online Editor support
-   Eventually, JSON Schema / `@hediet/semantic-json` support

## Target

-   Alternative to ICU message format
-   Alternative to xml
-   Alternative to json/json5/yaml/toml
