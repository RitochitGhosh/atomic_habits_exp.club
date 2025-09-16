"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const categories_1 = __importDefault(require("./routes/categories"));
const habits_1 = __importDefault(require("./routes/habits"));
const tracker_1 = __importDefault(require("./routes/tracker"));
const feed_1 = __importDefault(require("./routes/feed"));
const leaderboard_1 = __importDefault(require("./routes/leaderboard"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const socketHandlers_1 = require("./socket/socketHandlers");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["*"]
    }
});
exports.io = io;
const PORT = process.env.PORT || 3001;
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(limiter);
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
const swaggerDocument = yamljs_1.default.load(path_1.default.join(__dirname, "./openapi.yaml"));
app.use("/docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/habits', habits_1.default);
app.use('/api/tracker', tracker_1.default);
app.use('/api/feed', feed_1.default);
app.use('/api/leaderboard', leaderboard_1.default);
app.use('/api/notifications', notifications_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
(0, socketHandlers_1.setupSocketHandlers)(io);
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
server.listen(PORT, () => {
    console.log(`Server running on  http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map