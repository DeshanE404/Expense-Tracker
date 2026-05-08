import dns from 'dns';
import { Resolver } from 'dns';
const resolver = new Resolver();
resolver.setServers(['8.8.8.8']);

resolver.resolveSrv('_mongodb._tcp.cluster0.43hrebs.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('Google DNS SRV Resolution failed:', err);
  } else {
    console.log('Google DNS SRV Resolution success:', addresses);
  }
});
