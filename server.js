import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import Koa from 'koa';

const app = new Koa();
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
// response
app.use(ctx => {
  ctx.body = '撒大苏打';
});


app.listen(3000);
