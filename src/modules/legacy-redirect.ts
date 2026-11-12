import { type UserModule } from '~/types'

// The studio lives at `/` again. Old `/generator?template=…` links keep their roll:
// query and hash pass through, and the store rewrites them to a `?p=` recipe.
export const install: UserModule = ({ router }) => {
  router.beforeEach((to) => {
    if (to.path === '/generator')
      return { path: '/', query: to.query, hash: to.hash, replace: true }
  })
}
