export function ConnectModal() {
  return <form action="/api/accounts/connect" method="post" className="surface grid gap-3 p-4"><input className="input" name="platform" required /><input className="input" name="primary_key" required /><button className="btn btn-primary">Conectar</button></form>;
}
