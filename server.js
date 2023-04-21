import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { MongoClient, ObjectId } from 'mongodb';
import minimist from 'minimist';
import Koa from 'koa';
import Router from 'koa-router';

// 连接mongodb
const processParams = minimist(process.argv.slice(2));
const { host = ':27017', dbString = 'mongodb://localhost:27017' } = processParams;
const client = new MongoClient(dbString);

await client.connect();
const db = client.db('local');

const handlers = {
	// 日志记录搜索
	async logList(params) {
		return {
			data: await db
				.collection('startup_log')
				.find({
					...(params.pid && { pid: params.pid }),
				})
				.sort({ time: -1 })
				.limit(100)
				.toArray()
		};
	},

	// 日志记录搜索
	async testInert(params) {
		const { pid, testName } = params;
		if (!testName) {
			throw '必须指定测试名';
		}
		const { insertedId } = await db.collection('test').insertOne({
			pid,
			testName,
			createTime: +new Date(),
			status: 0,
		});
		return {
			data: await db.collection('test').findOne({ _id: ObjectId(insertedId) })
		};
	},
}
// 创建koa
const app = new Koa();
var router = new Router();
//跨域访问限制
app.use(
	cors({
		origin: '*',
		maxAge: 3600,
		credentials: true,
		methods: 'POST,OPTIONS,PUT,HEAD',
		headers: ' Authentication,Origin, X-Requested-With, Content-Type, Accept,token'
	})
);
app.use(bodyParser());

// koa middleware中间件
app.use(async (ctx, next)=>{
    await next()

    console.log('url路径：' + ctx.request.url)
})


// 指定一个url匹配
// Router 一般只需要用到get和post
router.get('/hello/:name', async (ctx, next) => {
    var name = ctx.params.name;
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
});
router.get('/', async (ctx, next) => {
    ctx.type = 'html';
    ctx.body = '<h1>router test</h1>';
})
    .get("/users", async (ctx) => {
				console.log('查询参数', ctx.query);
        ctx.body = '获取用户列表';
    })
    .get("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `获取id为${id}的用户`;
    })
    .post("/testInert", async (ctx, next) => {
				const { method, path, body, host } = ctx.request;

				try {
					//根据path 获取handlers 里面的方法
					ctx.body = JSON.stringify({
						...(await handlers[path.substring(1)](body)),
						method: method,
						path: path,
						host: host,
						success: true
					});
				} catch (error) {
					ctx.body = JSON.stringify({
						...body,
						message: String(error),
						success: false
					});
				} finally {
					return next();
				}
    })
    .put("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `修改id为${id}的用户`;
    })
    .del("/users/:id", async (ctx) => {
        const { id } = ctx.params
        ctx.body = `删除id为${id}的用户`;
    })
    .all("/users/:id", async (ctx) => {
        ctx.body = ctx.params;
    });


// 报错系统
app.use(router.allowedMethods({
    // throw: true, // 抛出错误，代替设置响应头状态
    // notImplemented: () => '不支持当前请求所需要的功能',
    // methodNotAllowed: () => '不支持的请求方式'
}));

//注册路由到app上
app.use(router.routes());
app.listen(3000);
