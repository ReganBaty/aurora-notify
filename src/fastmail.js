const fastmailUrl = 'https://api.fastmail.com/jmap/session';
let headers = {};

const draftResponse = async (apiUrl, accountId, draftId, identityId, input) => {
	const messageBody = input.reduce((a, b) => a + `k_aus ${b.k_aus} at ${b.start_date} - ${b.end_date} \n`, '');

	const draftObject = {
		from: [{ email: env.my_email }],
		to: [{ email: env.my_email }],
		subject: 'Hello, world!',
		keywords: { $draft: true },
		mailboxIds: { [draftId]: true },
		bodyValues: { body: { value: messageBody, charset: 'utf-8' } },
		textBody: [{ partId: 'body', type: 'text/plain' }],
	};

	const response = await fetch(apiUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail', 'urn:ietf:params:jmap:submission'],
			methodCalls: [
				['Email/set', { accountId, create: { draft: draftObject } }, 'a'],
				[
					'EmailSubmission/set',
					{
						accountId,
						onSuccessDestroyEmail: ['#sendIt'],
						create: { sendIt: { emailId: '#draft', identityId } },
					},
					'b',
				],
			],
		}),
	});

	const data = await response.json();
	console.log(JSON.stringify(data, null, 2));
};

const getSession = async () => {
	const response = await fetch('https://api.fastmail.com/jmap/session', {
		method: 'GET',
		headers,
	});
	return response.json();
};

const identityQuery = async (apiUrl, accountId, env) => {
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail', 'urn:ietf:params:jmap:submission'],
			methodCalls: [['Identity/get', { accountId, ids: null }, 'a']],
		}),
	});
	const data = await response.json();
	const username = env.my_email;

	return await data['methodResponses'][0][1].list.filter((identity) => identity.email === username)[0].id;
};

const mailboxQuery = async (apiUrl, accountId) => {
	const response = await fetch(apiUrl, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			using: ['urn:ietf:params:jmap:core', 'urn:ietf:params:jmap:mail'],
			methodCalls: [['Mailbox/query', { accountId, filter: { name: 'Drafts' } }, 'a']],
		}),
	});
	const data = await response.json();

	return await data['methodResponses'][0][1].ids[0];
};
let env = {};
export const run = async (input, envIn) => {
	env = envIn;
	headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${env.FASTMAIL_API_TOKEN}`,
	};
	const session = await getSession();
	const apiUrl = session.apiUrl;
	const accountId = session.primaryAccounts['urn:ietf:params:jmap:mail'];
	const draftId = await mailboxQuery(apiUrl, accountId);
	const identityId = await identityQuery(apiUrl, accountId, env);
	draftResponse(apiUrl, accountId, draftId, identityId, input);
};
