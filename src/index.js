import { run } from './fastmail';

export default {
	async scheduled(request, env, ctx) {
		const bomRequest = await fetch('https://sws-data.sws.bom.gov.au/api/v1/get-aurora-watch', {
			method: 'post',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				api_key: env.BOM_API_TOKEN,
			}),
		});
		const data = await bomRequest.json();
		const filtered = data.data.filter((d) => Number(d.k_aus) >= 6);
		if (filtered.length > 0) {
			await run(filtered, env);
		}

		return new Response('Hello World!');
	},
};
