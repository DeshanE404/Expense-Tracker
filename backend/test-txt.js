import { Resolver } from 'dns';
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

resolver.resolveTxt('cluster0.43hrebs.mongodb.net', (err, records) => {
  if (err) {
    console.error('Google DNS TXT Resolution failed:', err);
  } else {
    console.log('Google DNS TXT Resolution success:', records);
  }
});
