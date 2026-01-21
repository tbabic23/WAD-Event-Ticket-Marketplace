"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const test_1 = require("./routes/test");
const auth_1 = require("./routes/auth");
const user_1 = require("./routes/user");
const events_1 = require("./routes/events");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', test_1.router);
app.use('/api/auth', auth_1.router);
app.use('/api/user', user_1.router);
app.use('/api/events', events_1.router);
// Serve static files from the frontend build
app.use(express_1.default.static(path_1.default.join(__dirname, '../../frontend/dist/frontend')));
// Catch-all handler: send back index.html for any non-API routes (for SPA routing)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../../frontend/dist/frontend/index.html'));
});
exports.default = app;
