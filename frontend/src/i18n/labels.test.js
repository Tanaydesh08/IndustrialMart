import test from 'node:test'
import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { readFile as readSource } from 'node:fs/promises'
import { hasTranslation, translate, translateError } from './labels.js'

const sourceRoot = resolve(import.meta.dirname, '..')

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(entry => {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return ['.jsx', '.js'].includes(extname(entry.name)) && !entry.name.endsWith('.test.js') ? [path] : []
  }))
  return nested.flat()
}

test('all literal UI translation calls have Hindi Roman catalog entries', async () => {
  const files = await sourceFiles(sourceRoot)
  const keys = new Set()
  for (const file of files) {
    const content = await readFile(file, 'utf8')
    for (const match of content.matchAll(/\bt\('([^']+)'\)/g)) keys.add(match[1])
  }
  const untranslated = [...keys].filter(key => !hasTranslation(key))
  assert.deepEqual(untranslated, [], `Missing Hindi Roman entries: ${untranslated.join(', ')}`)
})

test('English and Hindi Roman modes have representative role and payment labels', () => {
  for (const key of ['Buyer Panel', 'My Ads', 'Approve', 'Demo: Payment successful', 'Pending review', 'rice-milling-machinery']) {
    assert.equal(translate(key, 'en'), key)
    assert.notEqual(translate(key, 'hi'), key)
  }
  assert.equal(translate('Deals', 'hi'), 'Deals')
  assert.equal(translate('Admin Panel', 'hi'), 'Admin Panel')
  assert.equal(translate('Sign in', 'en'), 'Login')
  assert.equal(translate('Login', 'hi'), 'Login')
  assert.equal(translate('Create Account', 'hi'), 'Create Account')
  assert.equal(translate('Create account', 'en'), 'Create Account')
  assert.equal(translateError('Some new backend error', 'hi'), 'Request poori nahi ho saki. Dobara koshish karein.')
})

test('frontend routes protect every feature area and preserve auth-only entry routes', async () => {
  const app = await readSource(resolve(sourceRoot, 'App.jsx'), 'utf8')
  assert.match(app, /path="\/marketplace" element=\{<Authenticated>/)
  assert.match(app, /<RoleRoute role="BUYER">/)
  assert.match(app, /<RoleRoute role="SELLER">/)
  assert.match(app, /<RoleRoute role="ADMIN">/)
  assert.match(app, /path="\/login"/)
  assert.match(app, /path="\/register"/)
  assert.match(app, /path="\*" element=\{<Authenticated><NotFoundPage\/>/)
  const context = await readSource(resolve(sourceRoot, 'context', 'AppContext.jsx'), 'utf8')
  assert.match(context, /im:unauthorized/)
  assert.match(context, /removeItem\('im-user'\)/)
})

test('buyer payment creation and protected details calls use the mapped backend routes', async () => {
  const api = await readSource(resolve(sourceRoot, 'api', 'unlockApi.js'), 'utf8')
  const backendController = await readSource(resolve(sourceRoot, '../../Backend/Backend/src/main/java/com/IndustrialMart/Backend/payment/PrototypePaymentController.java'), 'utf8')
  const buyerController = await readSource(resolve(sourceRoot, '../../Backend/Backend/src/main/java/com/IndustrialMart/Backend/unlock/BuyerListingUnlockController.java'), 'utf8')
  assert.match(api, /post\('\/api\/prototype\/payments\/listing-unlock'/)
  assert.match(api, /params: \{ listingId \}/)
  assert.match(api, /get\(`\/api\/prototype\/buyer\/listings\/\$\{encodeURIComponent\(listingId\)\}\/details`, config\)/)
  assert.doesNotMatch(api, /\/listings\/.*\/unlock/)
  assert.match(backendController, /@RequestMapping\("\/api\/prototype"\)/)
  assert.match(backendController, /@PostMapping\("\/payments\/listing-unlock"\)/)
  assert.match(buyerController, /@RequestMapping\("\/api\/prototype\/buyer"\)/)
  assert.match(buyerController, /@GetMapping\("\/listings\/\{listingId\}\/details"\)/)
})

test('listing unlock is in-place, request guarded, and language control is a single toggle', async () => {
  const details = await readSource(resolve(sourceRoot, 'pages', 'ListingDetailsPage.jsx'), 'utf8')
  const layout = await readSource(resolve(sourceRoot, 'components', 'layout', 'SiteLayout.jsx'), 'utf8')
  assert.doesNotMatch(details, /(?:window\.)?location\.reload\s*\(/)
  assert.match(details, /actionInFlight\.current\s*=\s*true/)
  assert.match(details, /requestVersion\.current/)
  assert.match(details, /getUnlockedListingDetails\(id, \{ signal \}\)/)
  assert.match(details, /setListing\(\{ \.\.\.details, unlockAuthorized: true \}\)/)
  assert.doesNotMatch(layout, /<select/)
  assert.match(layout, /setLanguage\(language === 'en' \? 'hi' : 'en'\)/)
})
