process.env.PORT = process.env.PORT ?? 4200;
process.env.ARC_LOCAL = process.env.ARC_LOCAL ?? 1;
process.env.ARC_TABLES_PORT = process.env.ARC_TABLES_PORT ?? 4255;

const arc = require("@architect/architect");

void arc();
