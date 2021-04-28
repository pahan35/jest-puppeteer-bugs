test('toFill mutates previous field', async () => {
  page.waitForFrame = async (name, {timeout = 3500} = {}) => {
    const frames = new Set()
    return new Promise((resolve, reject) => {
      const waitTimeout = setTimeout(() => {
        reject(
          Error(
            `Timeout while waiting for frame "${name}", have: ${JSON.stringify(
              [...frames],
            )}`,
          ),
        )
      }, timeout)

      function checkFrame() {
        const frame = page.frames().find(f => {
          const fname = f.name()
          frames.add(fname)
          return fname.includes(name)
        })
        if (frame) {
          clearTimeout(waitTimeout)
          resolve(frame)
        } else {
          page.once('framenavigated', checkFrame)
        }
      }

      checkFrame()
    })
  }

  await page.goto('https://stripe.dev/elements-examples/')
  const cardnumber = '4242 4242 4242 4242'
  const stripeFrame = await page.waitForFrame('privateStripeFrame', {
    timeout: 5000,
  })
  await stripeFrame.waitFor('body')
  const stripeForm = await stripeFrame.$('body')
  await expect(stripeForm).toFillForm(
    'form',
    {
      cardnumber,
      cvc: '424',
      'exp-date': '04 / 42',
      postal: '42424',
    },
    {delay: 50, visible: true},
  )
  const value = await stripeForm.evaluate(
    () => document.querySelector('[name="cardnumber"]').value,
  )
  expect(value).toBe(cardnumber)
});
