# Changelog

## [1.0.4](https://github.com/voyagi/n8n-ai-automation/compare/v1.0.3...v1.0.4) (2026-03-16)


### Bug Fixes

* migrate Renovate config from matchPackagePatterns to matchPackageNames ([#26](https://github.com/voyagi/n8n-ai-automation/issues/26)) ([4f3d759](https://github.com/voyagi/n8n-ai-automation/commit/4f3d759ea5a5a506d3a31fa6b476b84296137e60)), closes [#24](https://github.com/voyagi/n8n-ai-automation/issues/24)

## [1.0.3](https://github.com/voyagi/upwork-n8n-automation/compare/v1.0.2...v1.0.3) (2026-03-13)


### Bug Fixes

* resilient response handling + repo cleanup for public visibility ([#22](https://github.com/voyagi/upwork-n8n-automation/issues/22)) ([76b9dd3](https://github.com/voyagi/upwork-n8n-automation/commit/76b9dd306abf1fe6acf8088de6e7a7834e13822d))

## [1.0.2](https://github.com/voyagi/upwork-n8n-automation/compare/v1.0.1...v1.0.2) (2026-03-12)


### Bug Fixes

* **form:** make response handling resilient to workflow variants ([#20](https://github.com/voyagi/upwork-n8n-automation/issues/20)) ([ad7f615](https://github.com/voyagi/upwork-n8n-automation/commit/ad7f615a5048685faddaf355108eb7044f9cf73e))

## [1.0.1](https://github.com/voyagi/upwork-n8n-automation/compare/v1.0.0...v1.0.1) (2026-03-11)


### Bug Fixes

* **deps:** override simple-git to 3.33.0 for critical RCE fix ([#17](https://github.com/voyagi/upwork-n8n-automation/issues/17)) ([65fe74a](https://github.com/voyagi/upwork-n8n-automation/commit/65fe74a4df042948624a9b3dfd4417a50abf21fb))

## 1.0.0 (2026-03-03)


### Features

* **01-01:** restructure HTML for floating labels and professional layout ([9d4dd7d](https://github.com/voyagi/upwork-n8n-automation/commit/9d4dd7dbfa7be812506cf9f2dc344f40393cc917))
* **01-01:** rewrite CSS for modern SaaS aesthetic with floating labels ([46d4c14](https://github.com/voyagi/upwork-n8n-automation/commit/46d4c14d1beccf531b6abaa30ce3dea749b03ecb))
* **01-02:** implement form validation and submission handling ([063615c](https://github.com/voyagi/upwork-n8n-automation/commit/063615c7130d050741e80fefa421ce8aafa8d1c0))
* **02-01:** create n8n workflow with webhook and validation ([9a26b9f](https://github.com/voyagi/upwork-n8n-automation/commit/9a26b9fdd2134a73f541481ec11c57e6b2504542))
* **02-02:** add AI results display to success card ([3331429](https://github.com/voyagi/upwork-n8n-automation/commit/33314295fd5a120436319c86e9ec481ba1b7bab1))
* **02-02:** refactor form submission with CONFIG, auth, and timeout ([2b6b323](https://github.com/voyagi/upwork-n8n-automation/commit/2b6b323b0deb9a5eba695b98d80f76358e91918b))
* **03-01:** add OpenAI and Parse AI Response nodes to workflow ([8749c7d](https://github.com/voyagi/upwork-n8n-automation/commit/8749c7d08b4551b012b6ad7ae4e325693cebf7e2))
* **03-01:** rewire workflow to use OpenAI, remove mock node ([9880ea8](https://github.com/voyagi/upwork-n8n-automation/commit/9880ea8624e83071016a415b34d85afac5804474))
* **03-02:** map AI response fields to success card elements ([fcb75d7](https://github.com/voyagi/upwork-n8n-automation/commit/fcb75d73b6c157c6cc9179cb392097bc7405fb77))
* **03-02:** update success card to show AI summary instead of estimated response ([a3afce6](https://github.com/voyagi/upwork-n8n-automation/commit/a3afce60ed39ed1671d206cfdbbde53e9966a53a))
* **04-01:** add frontend spam detection handling ([2eb57bd](https://github.com/voyagi/upwork-n8n-automation/commit/2eb57bda08b372d6f807e062e40cea2ab75f0da3))
* **04-01:** add Switch node and Spam Response node for conditional routing ([7e3c829](https://github.com/voyagi/upwork-n8n-automation/commit/7e3c82901546336ce4d46a1862fe7264bb5925b2))
* **05-storage-integration:** add Google Sheets storage nodes and rewire workflow ([1f2752d](https://github.com/voyagi/upwork-n8n-automation/commit/1f2752ddcb887f943650ac6716916304ab13cdcf))
* **06-notification-system:** add Slack and Email notification nodes ([2ca94ba](https://github.com/voyagi/upwork-n8n-automation/commit/2ca94bab96fcfbbeafca1448d7788a4d9dd3320f))
* **07-error-handling-testing:** add AI fallback handler and error resilience ([37de89a](https://github.com/voyagi/upwork-n8n-automation/commit/37de89a520028e95e875a1c6a154387fe148e36e))
* **07-error-handling-testing:** add Build Warnings node and notification failure tracking ([d4ca159](https://github.com/voyagi/upwork-n8n-automation/commit/d4ca1591040703d06c754f3633282fd576fa6fb5))
* **07-error-handling-testing:** add test dataset and batch submission script ([b13f7fc](https://github.com/voyagi/upwork-n8n-automation/commit/b13f7fcd4688c8d915e5e6d2fcdb18d39c44bf93))
* add validation, tests, security doc, and dev tooling ([f85c376](https://github.com/voyagi/upwork-n8n-automation/commit/f85c3765d248b65def17fdf9e6b3d713444182d2))
* scaffold n8n automation portfolio project ([dd1b7e9](https://github.com/voyagi/upwork-n8n-automation/commit/dd1b7e9fcc22a21d8874a0f815944f51af209df4))


### Bug Fixes

* **01-01:** hide placeholder text behind floating labels ([afc3ae7](https://github.com/voyagi/upwork-n8n-automation/commit/afc3ae73c068f073508dd987386348e13ed5b1c0))
* **01:** revise plans based on checker feedback ([8c8aa3d](https://github.com/voyagi/upwork-n8n-automation/commit/8c8aa3db9b743e5343669405aace1d9ca70f84c3))
* **03:** revise plans based on checker feedback ([31ecb13](https://github.com/voyagi/upwork-n8n-automation/commit/31ecb13150b61a4dada0abf1ee0150054a7e9752))
* **04-01:** fix Switch node routing and frontend spam detection ([6e9de14](https://github.com/voyagi/upwork-n8n-automation/commit/6e9de141e65f3b5860931fc1e2c92bfd1a8d7182))
* **05-storage-integration:** replace Set nodes with Code nodes and fix sheet config ([8136efe](https://github.com/voyagi/upwork-n8n-automation/commit/8136efe4564560c8921f318a4f08bd303f13418a))
* **deps,security:** override vulnerable deps and address challenge findings ([#8](https://github.com/voyagi/upwork-n8n-automation/issues/8)) ([d304467](https://github.com/voyagi/upwork-n8n-automation/commit/d30446765b2dfbc3c671e013f14622a657164c8d))
* **deps:** add minimatch override, bump tar and fast-xml-parser overrides ([#3](https://github.com/voyagi/upwork-n8n-automation/issues/3)) ([5a1878e](https://github.com/voyagi/upwork-n8n-automation/commit/5a1878e5d8b5da19cff69219eda4ebafa38dd96e))
* **deps:** bump n8n to 2.9.4 (4 CRITICAL + 7 HIGH vulns) ([#2](https://github.com/voyagi/upwork-n8n-automation/issues/2)) ([103a332](https://github.com/voyagi/upwork-n8n-automation/commit/103a3324f284b05384c6c610cd88962fdef70b2e))
* **security:** update vulnerable deps (form-data, axios, qs, semver, hono) ([d1025fd](https://github.com/voyagi/upwork-n8n-automation/commit/d1025fdce229a03401f16164fd537013e96cac8a))
