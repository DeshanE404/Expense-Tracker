import dns from 'dns';

dns.resolveSrv('_mongodb._tcp.cluster0.43hrebs.mongodb.net', (err, addresses) => {
  if (err) {
    console.error('DNS SRV Resolution failed:', err);
  } else {
    console.log('DNS SRV Resolution success:', addresses);
  }
});
