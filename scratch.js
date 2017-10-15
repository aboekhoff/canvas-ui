var app = new App(
  Rect.create({ left: 20, top: 20 },
    Rect.create({
      left: 0,
      top: 0,
      width: 200,
      height: 200,
      color: '#ffccaa',
      onMouseEnter() {
        console.log('hi!')
        this.setState({ color: '#995533' })
      },
      onMouseExit() {
        console.log('bye')
        this.setState({ color: '#ffccaa' })
      }
    }),
    Rect.create({
      left: 220,
      top: 0,
      width: 200,
      height: 200,
      color: '#ccffaa',
      onMouseEnter() {
        console.log('hi!')
        this.setState({ color: '#559933' })
      },
      onMouseExit() {
        console.log('bye')
        this.setState({ color: '#ccffaa' })
      }
    }),
    Rect.create({
      left: 0,
      top: 220,
      width: 200,
      height: 200,
      color: '#aaccff',

      onMouseEnter() {
        console.log('hi!')
        this.setState({ color: '#335599' })
      },
      onMouseExit() {
        console.log('bye')
        this.setState({ color: '#aaccff' })
      }
    }),

    Text.create({
      content: 'I think you have a real problem',
      font: '12px serif',
      color: '#222266',
      left: 240,
      top: 320
    })
  )
)

console.log(app)
app.start()
