import figlet from 'figlet'; 

const server = Bun.serve({
  port: 8000,
  routes: {
    "/": () => new Response('Bun!'),
    "/figlet": () => { 
      const body = figlet.textSync('Bun!'); 
      return new Response(body); 
    } 
  }
});

console.log(`Listening on ${server.url}`);