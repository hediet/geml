# GeML: Generic Markup Language

[![](https://img.shields.io/twitter/follow/hediet_dev.svg?style=social)](https://twitter.com/intent/follow?screen_name=hediet_dev)

# Install

To install the library:

```
yarn add @hediet/geml
```

## Example Geml Documents

### A contact book

```
{ContactBook {-- "ContactBook" is the type of the object --}
    contacts: [
        {-- The next object does not have a type --}
        { firstName: <Max> lastName: <Mustermann> }
    ]
}
```

### Text with markup

```
<
    Hello {Bold <World>}!
    You can {Bold <even {Italic <nest>} markup!>}
>
```

### As I18n Formatting Language

```
You have {count} unread {plural {count} one:<E-Mail> other:<E-Mails>}!
```

```
Click {link <here>} to read them!
```

### Demonstration of all language features

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
        <key>: <baz>
    }

    arr: [
        item1
        "item2"
    ]

    {-test-
    Comment
    -test-}

    blaa: <test<
        \test\:{test}
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
Document ::= Header? (Trivias? Value)* Trivias?

Header ::= '{!geml 0.1' (Trivias HeaderAttr)* Trivias? '}'

HeaderAttr ::= HeaderAttrPropertyName ':' Trivias? HeaderAttrPropertyValue
HeaderAttrPropertyName  ::= Identifier
HeaderAttrPropertyValue ::= Value

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
PropertyValue      ::= Value

NamedProperty      ::= PropertyName ':' Trivias? PropertyValue
PropertyName       ::= Identifier | String

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
