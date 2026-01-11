type Props = { title: string }

export function Header({ title }: Props) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        borderBottom: '1px solid #eee'
      }}
    >
      <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
    </header>
  )
}
