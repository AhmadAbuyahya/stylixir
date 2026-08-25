import { type UserModule } from '~/types'

// The generator used to live at `/`, with its state persisted as query/hash
// params (`?template=zigzag&sizeX=140...`). Now that `/` is the marketing
// home page, forward any old shared/bookmarked link straight to `/generator`
// with its params intact, instead of dropping the visitor on the pitch page.
export const install: UserModule = ({ router }) => {
  router.beforeEach((to) => {
    if (to.path === '/' && to.query.template)
      return { path: '/generator', query: to.query, hash: to.hash, replace: true }
  })
}
