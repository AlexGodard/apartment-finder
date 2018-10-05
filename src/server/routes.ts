
import Router from 'koa-router';
import { IRouterContext } from 'koa-router';

const router = new Router();

router.get('/', async (ctx: IRouterContext) => {
    ctx.body = 'Hello World!';
});

router.get('/test', async (ctx: IRouterContext) => {
    ctx.status = 201;
    ctx.body = 'test';
});

export const routes = router.routes();
