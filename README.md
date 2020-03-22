# Backend für Krankenhausnavi
Dies ist das Serverless Backend für Krankenhausnavi.

## Was wird benötigt
- Serverless Cli: "npm install -g serverless"
- MariaDb Datenbank: z.B.: RDBS. Testdatenbank liegt in Templates

## Installation
```
    $ npm install
```

## Starten einer Lokalen Instanz zum Testen
Davor muss die Datenbank Konfig angepasst werden: config/database.example.json und umbenannt in database.dev.json. 
In die Datenbank muss der File: test-data.sql import sein. 
```
    $ sls offline start
```
