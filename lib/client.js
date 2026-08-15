/**
 * dsh-better-model-selector — browser half.
 *
 * Shadows the built-in `conversation.input.model` seat (the composer model
 * selector) at a lower priority and replaces it with two independent controls:
 *
 *   1. ModelDropdown — a compact trigger that opens a searchable, provider
 *      grouped list with a per-model star (favorite) toggle, persisted to
 *      localStorage. Favorites feed the Ctrl+P cycling shortcut.
 *   2. EffortSlider   — a compact range input for the current model's
 *      reasoning effort levels, driven by the same per-session ModelDirectory
 *      as the built-in selector (so it stays one shared state with the /model
 *      command popup).
 *
 * Keyboard shortcuts (global, only while a normal session is current):
 *   - Ctrl/Cmd+P: rotate among favorited models.
 *   - Ctrl/Cmd+T: rotate through the current model's reasoning-effort levels.
 */
window.__ModuleLoader__.load({
  id: 'dsh-better-model-selector',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    var React = require('react')

    // ── CSS ────────────────────────────────────────────────────────────────
    const CSS = [
      '.dms-root{display:flex;align-items:center;gap:8px;min-width:0;}',
      '.dms-dd{position:relative;min-width:0;display:inline-flex;}',
      '.dms-dd-trigger{display:inline-flex;align-items:center;gap:4px;min-width:0;max-width:220px;height:28px;padding:0 8px;border:none;border-radius:24px;background:transparent;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9));font-size:13px;font-weight:500;line-height:20px;cursor:pointer;font-family:inherit;}',
      '.dms-dd-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,inherit);}',
      '.dms-dd-trigger:focus-visible{box-shadow:0 0 0 2px var(--dsw-alias-border-l3,rgba(127,127,127,.4));outline:none;}',
      '.dms-dd-trigger:disabled{color:var(--dsw-alias-label-dimmed,rgba(127,127,127,.5));cursor:default;}',
      '.dms-dd-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}',
      '.dms-dd-star{color:var(--dsw-alias-state-warn-primary,#d99b2b);flex:none;font-size:12px;line-height:1;}',
      '.dms-dd-chevron{color:var(--dsw-alias-label-caption,rgba(127,127,127,.6));flex:none;font-size:11px;line-height:1;}',
      '.dms-menu{position:absolute;bottom:calc(100% + 8px);right:0;z-index:200;width:min(300px,calc(100vw - 32px));max-height:min(420px,calc(100vh - 96px));display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-inverted,rgba(127,127,127,.3));background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,#202225));color:var(--dsw-alias-label-primary,#e8e8ea);border-radius:12px;padding:4px;box-shadow:var(--dsw-shadow-lv3,0 12px 32px rgba(0,0,0,.4));overflow:hidden;}',
      '.dms-search{display:flex;gap:4px;padding:4px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.15));flex:none;}',
      '.dms-search-input{flex:1;min-width:0;background:var(--dsw-alias-bg-layer-1,rgba(127,127,127,.06));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.2));border-radius:6px;color:var(--dsw-alias-label-primary,inherit);padding:4px 8px;font-size:12px;line-height:18px;outline:none;box-sizing:border-box;font-family:inherit;}',
      '.dms-search-input:focus{border-color:var(--dsw-static-deepseek-500,#4176e6);}',
      '.dms-favonly{flex:none;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.2));background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.08));color:var(--dsw-alias-label-secondary,inherit);border-radius:6px;padding:0 8px;font-size:13px;line-height:22px;cursor:pointer;font-family:inherit;}',
      '.dms-favonly:hover{border-color:var(--dsw-alias-border-l2,rgba(127,127,127,.35));}',
      '.dms-favonly-on{color:var(--dsw-alias-state-warn-primary,#d99b2b);border-color:var(--dsw-alias-state-warn-primary,#d99b2b);}',
      '.dms-list{overflow:auto;padding:2px;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-static-deepseek-500,#4176e6) transparent;}',
      '.dms-list::-webkit-scrollbar{width:8px;height:8px;}',
      '.dms-list::-webkit-scrollbar-track{background:transparent;}',
      '.dms-list::-webkit-scrollbar-thumb{background:var(--dsw-static-deepseek-500,#4176e6);border-radius:4px;}',
      '.dms-list::-webkit-scrollbar-thumb:hover{background:var(--dsw-static-deepseek-400,#679efe);}',
      '.dms-group-title{padding:8px 8px 4px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));}',
      '.dms-row{display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;cursor:pointer;}',
      '.dms-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.1));}',
      '.dms-row-active{background:color-mix(in srgb,var(--dsw-static-deepseek-500,#4176e6) 16%,transparent);}',
      '.dms-row-star{flex:none;cursor:pointer;border:none;background:transparent;padding:0 2px;font-size:14px;line-height:1;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));}',
      '.dms-row-star:hover{color:var(--dsw-alias-label-primary,inherit);}',
      '.dms-row-star-on{color:var(--dsw-alias-state-warn-primary,#d99b2b);}',
      '.dms-row-copy{flex:1;min-width:0;display:flex;flex-direction:column;}',
      '.dms-row-name{font-size:13px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dms-row-desc{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.dms-row-check{flex:none;color:var(--dsw-static-deepseek-500,#4176e6);font-size:13px;line-height:1;}',
      '.dms-empty{padding:10px;font-size:13px;line-height:20px;color:var(--dsw-alias-label-tertiary,rgba(127,127,127,.7));text-align:center;}',
      '.dms-effort{display:inline-flex;align-items:center;gap:6px;min-width:0;}',
      '.dms-effort-name{flex:none;font-size:12px;line-height:20px;color:var(--dsw-alias-label-secondary,rgba(127,127,127,.9));}',
      '.dms-effort-range{-webkit-appearance:none;appearance:none;width:72px;height:16px;background:transparent;cursor:pointer;margin:0;}',
      '.dms-effort-range::-webkit-slider-runnable-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.4));}',
      '.dms-effort-range::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:14px;height:14px;border-radius:50%;background:#ffffff;border:2px solid var(--dsw-static-deepseek-500,#4176e6);margin-top:-5px;cursor:pointer;}',
      '.dms-effort-range::-moz-range-track{height:4px;border-radius:2px;background:var(--dsw-alias-border-l2,rgba(127,127,127,.4));}',
      '.dms-effort-range::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#ffffff;border:2px solid var(--dsw-static-deepseek-500,#4176e6);cursor:pointer;}',
      '.dms-effort-range:disabled{cursor:default;opacity:.5;}',
      '.dms-effort-value{flex:none;font-size:12px;line-height:20px;color:var(--dsw-alias-label-primary,inherit);max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
    ].join('\n')
    const tagId = 'dsh-better-model-selector/client.css'
    if (typeof document !== 'undefined' && document.querySelector('style[data-plugin-css=' + JSON.stringify(tagId) + ']') === null) {
      const tag = document.createElement('style')
      tag.dataset.plugin = 'dsh-better-model-selector'
      tag.dataset.pluginCss = tagId
      tag.textContent = CSS
      document.head.appendChild(tag)
    }

    // ── Favorites store ─────────────────────────────────────────────────────
    // Backed by a host-scoped cookie (not localStorage): localStorage is
    // origin-scoped INCLUDING port, so a DSH restart that lands on a new port
    // orphans the previous origin's storage. Cookies are host-scoped and
    // survive the port change. Legacy localStorage favorites are migrated on
    // first read.
    const FAV_COOKIE = 'dms_favs'
    const FAV_OLD_COOKIE = 'dmt_favs'
    const FAV_LEGACY_KEY = 'dsh-model-toolbox:favorites:v1'
    const favListeners = new Set()
    let favCache = null

    function readCookieFavs(name) {
      try {
        if (typeof document === 'undefined' || !document.cookie) return null
        const parts = document.cookie.split(';')
        for (let i = 0; i < parts.length; i++) {
          const kv = parts[i].trim()
          if (kv.indexOf(name + '=') === 0) {
            const v = JSON.parse(decodeURIComponent(kv.slice(name.length + 1)))
            return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string' }) : []
          }
        }
      } catch (err) {}
      return null
    }
    function readLegacyFavs() {
      try {
        const v = JSON.parse(localStorage.getItem(FAV_LEGACY_KEY) || '[]')
        const list = Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string' }) : []
        if (list.length > 0) return list
      } catch (err) {}
      return null
    }
    function writeCookieFavs(list) {
      try {
        document.cookie = FAV_COOKIE + '=' + encodeURIComponent(JSON.stringify(list)) +
          '; path=/; max-age=31536000; SameSite=Lax'
      } catch (err) {}
    }
    function readFavs() {
      if (favCache === null) {
        const fromCookie = readCookieFavs(FAV_COOKIE)
        if (fromCookie !== null) {
          favCache = fromCookie
        } else {
          const oldCookie = readCookieFavs(FAV_OLD_COOKIE)
          if (oldCookie !== null) {
            favCache = oldCookie
            writeCookieFavs(oldCookie)
          } else {
            const legacy = readLegacyFavs()
            if (legacy !== null) {
              favCache = legacy
              writeCookieFavs(legacy)
              try { localStorage.removeItem(FAV_LEGACY_KEY) } catch (err) {}
            } else {
              favCache = []
            }
          }
        }
      }
      return favCache
    }
    function favSubscribe(fn) {
      favListeners.add(fn)
      return function () { favListeners.delete(fn) }
    }
    function favNotify() {
      favListeners.forEach(function (fn) { fn() })
    }
    function favToggle(id) {
      const list = readFavs().slice()
      const i = list.indexOf(id)
      if (i >= 0) list.splice(i, 1)
      else list.push(id)
      favCache = list
      writeCookieFavs(list)
      favNotify()
    }

    // ── Small helpers ───────────────────────────────────────────────────────
    function rowId(providerId, modelId) {
      return providerId + '/' + modelId
    }
    function choicesOf(groups) {
      const out = []
      ;(groups || []).forEach(function (g) {
        ;(g.models || []).forEach(function (m) { out.push({ group: g, model: m }) })
      })
      return out
    }
    function matchesQuery(group, model, q) {
      if (!q) return true
      return (model.name || '').toLowerCase().indexOf(q) >= 0
        || (model.id || '').toLowerCase().indexOf(q) >= 0
        || (model.description || '').toLowerCase().indexOf(q) >= 0
        || (group.name || '').toLowerCase().indexOf(q) >= 0
    }
    // Ordered effort choices for a model's reasoning metadata. A missing
    // defaultEffort prepends a synthetic "Default" (effort === undefined).
    function effortChoicesOf(reasoning) {
      if (!reasoning || !Array.isArray(reasoning.efforts) || reasoning.efforts.length === 0) return []
      const out = []
      if (reasoning.defaultEffort === undefined || reasoning.defaultEffort === null) {
        out.push({ id: undefined, name: 'Default' })
      }
      reasoning.efforts.forEach(function (e) { out.push({ id: e.id, name: e.name || e.id }) })
      return out
    }
    function effectiveEffortOf(current, reasoning) {
      if (current && current.reasoningEffort !== undefined) return current.reasoningEffort
      if (reasoning && reasoning.defaultEffort !== undefined) return reasoning.defaultEffort
      return undefined
    }

    // ── Active-session bridge for the global shortcuts ──────────────────────
    // The composer model seat only mounts for the current session, so the
    // last-mounted component is authoritative.
    const activeRef = { directory: null, select: null, available: false }

    function cycleFavoriteModel() {
      const a = activeRef
      if (!a.directory || !a.available || !a.select) return
      const state = a.directory.getSnapshot()
      const favs = readFavs()
      if (favs.length === 0) return
      const choices = choicesOf(state.groups)
      const seen = new Set()
      const favChoices = []
      choices.forEach(function (c) {
        const id = rowId(c.group.id, c.model.id)
        if (favs.indexOf(id) >= 0 && !seen.has(id)) {
          seen.add(id)
          favChoices.push(c)
        }
      })
      if (favChoices.length === 0) return
      let idx = -1
      const cur = state.current
      if (cur) {
        idx = favChoices.findIndex(function (c) {
          return c.group.id === cur.provider && c.model.id === cur.model
        })
      }
      const next = favChoices[(idx + 1) % favChoices.length]
      a.select({ provider: next.group.id, model: next.model.id }).catch(function () {})
    }

    function cycleEffort() {
      const a = activeRef
      if (!a.directory || !a.available || !a.select) return
      const state = a.directory.getSnapshot()
      const cur = state.current
      if (!cur) return
      const choice = choicesOf(state.groups).find(function (c) {
        return c.group.id === cur.provider && c.model.id === cur.model
      })
      if (!choice) return
      const efforts = effortChoicesOf(choice.model.reasoning)
      if (efforts.length === 0) return
      const effective = effectiveEffortOf(cur, choice.model.reasoning)
      let idx = efforts.findIndex(function (e) { return e.id === effective })
      if (idx < 0) idx = 0
      const next = efforts[(idx + 1) % efforts.length]
      const selection = { provider: choice.group.id, model: choice.model.id }
      if (next.id !== undefined) selection.reasoningEffort = next.id
      a.select(selection).catch(function () {})
    }

    function onKeydown(e) {
      if (e.defaultPrevented) return
      const mod = e.ctrlKey || e.metaKey
      if (!mod || e.altKey || e.shiftKey) return
      const k = e.key
      if (k === 'p' || k === 'P') {
        if (activeRef.directory && activeRef.available) {
          e.preventDefault()
          e.stopPropagation()
          cycleFavoriteModel()
        }
      } else if (k === 't' || k === 'T') {
        if (activeRef.directory && activeRef.available) {
          e.preventDefault()
          e.stopPropagation()
          cycleEffort()
        }
      }
    }

    // ── ModelDropdown ───────────────────────────────────────────────────────
    function ModelDropdown(props) {
      const locked = props.locked
      const state = props.state
      const choices = props.choices
      const current = props.current
      const currentChoice = props.currentChoice
      const select = props.select
      const load = props.load
      const favs = props.favs

      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [favOnly, setFavOnly] = React.useState(false)
      const rootRef = React.useRef(null)
      const inputRef = React.useRef(null)

      const busy = state.status === 'selecting'
      const modelLabel = currentChoice ? (currentChoice.model.name || currentChoice.model.id) : '选择模型'
      const currentId = currentChoice ? rowId(currentChoice.group.id, currentChoice.model.id) : null

      React.useEffect(function () {
        if (!open) return
        const onDoc = function (e) {
          if (rootRef.current && !rootRef.current.contains(e.target)) {
            setOpen(false)
            setQuery('')
          }
        }
        document.addEventListener('mousedown', onDoc)
        return function () { document.removeEventListener('mousedown', onDoc) }
      }, [open])

      React.useEffect(function () {
        if (open && inputRef.current) inputRef.current.focus()
      }, [open])

      const q = query.trim().toLowerCase()
      const groups = React.useMemo(function () {
        return state.groups.map(function (g) {
          return {
            group: g,
            models: g.models.filter(function (m) {
              const id = rowId(g.id, m.id)
              if (favOnly && favs.indexOf(id) < 0) return false
              return matchesQuery(g, m, q)
            }),
          }
        }).filter(function (g) { return g.models.length > 0 })
      }, [state.groups, q, favOnly, favs])

      function choose(group, model) {
        setOpen(false)
        setQuery('')
        select({ provider: group.id, model: model.id }).catch(function () {})
      }

      function onTrigger() {
        if (locked) return
        if (open) { setOpen(false); setQuery('') }
        else { setOpen(true); setQuery(''); load() }
      }

      function renderRow(group, model) {
        const id = rowId(group.id, model.id)
        const selected = !!current && current.provider === group.id && current.model === model.id
        const fav = favs.indexOf(id) >= 0
        return React.createElement('div', {
          key: id,
          className: 'dms-row' + (selected ? ' dms-row-active' : ''),
          role: 'option',
          'aria-selected': selected,
          onClick: function () { choose(group, model) },
        },
          React.createElement('button', {
            type: 'button',
            className: 'dms-row-star' + (fav ? ' dms-row-star-on' : ''),
            title: fav ? '取消收藏' : '标记为喜爱',
            'aria-pressed': fav,
            onClick: function (e) { e.stopPropagation(); favToggle(id) },
            onKeyDown: function (e) {
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); favToggle(id) }
            },
          }, fav ? '★' : '☆'),
          React.createElement('span', { className: 'dms-row-copy' },
            React.createElement('span', { className: 'dms-row-name' }, model.name || model.id),
            model.description ? React.createElement('span', { className: 'dms-row-desc' }, model.description) : null,
          ),
          selected ? React.createElement('span', { className: 'dms-row-check' }, '✓') : null,
        )
      }

      const empty = groups.length === 0
      const loading = state.status === 'loading' && state.groups.length === 0

      return React.createElement('div', { className: 'dms-dd', ref: rootRef },
        React.createElement('button', {
          type: 'button',
          className: 'dms-dd-trigger',
          disabled: locked,
          title: '切换模型（Ctrl+P 在收藏间轮换）',
          'aria-haspopup': 'listbox',
          'aria-expanded': open,
          onClick: onTrigger,
        },
          React.createElement('span', { className: 'dms-dd-label' }, modelLabel),
          (currentId && favs.indexOf(currentId) >= 0) ? React.createElement('span', { className: 'dms-dd-star' }, '★') : null,
          React.createElement('span', { className: 'dms-dd-chevron' }, open ? '▴' : '▾'),
        ),
        open ? React.createElement('div', { className: 'dms-menu', role: 'listbox', 'aria-label': '模型选择' },
          React.createElement('div', { className: 'dms-search' },
            React.createElement('input', {
              ref: inputRef,
              className: 'dms-search-input',
              placeholder: '搜索模型…',
              value: query,
              spellCheck: false,
              onChange: function (e) { setQuery(e.target.value) },
              onKeyDown: function (e) {
                if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); setQuery('') }
              },
            }),
            React.createElement('button', {
              type: 'button',
              className: 'dms-favonly' + (favOnly ? ' dms-favonly-on' : ''),
              title: favOnly ? '显示全部模型' : '只看收藏',
              onClick: function () { setFavOnly(!favOnly) },
            }, '★'),
          ),
          React.createElement('div', { className: 'dms-list' },
            groups.map(function (g) {
              return React.createElement(React.Fragment, { key: g.group.id },
                React.createElement('div', { className: 'dms-group-title' }, g.group.name),
                g.models.map(function (m) { return renderRow(g.group, m) }),
              )
            }),
            empty ? React.createElement('div', { className: 'dms-empty' },
              loading ? '加载中…' : (q || favOnly ? '无匹配模型' : '无可用模型')) : null,
          ),
        ) : null,
      )
    }

    // ── EffortSlider ────────────────────────────────────────────────────────
    function EffortSlider(props) {
      const locked = props.locked
      const state = props.state
      const current = props.current
      const reasoning = props.reasoning
      const select = props.select

      const efforts = React.useMemo(function () { return effortChoicesOf(reasoning) }, [reasoning])

      const effective = effectiveEffortOf(current, reasoning)
      let idx = efforts.findIndex(function (e) { return e.id === effective })
      if (idx < 0) idx = 0

      // Label follows the thumb immediately during a drag; the input stays
      // uncontrolled (keyed by the authoritative index) so async commits don't
      // snap the thumb back while the selection round-trips.
      const [labelIdx, setLabelIdx] = React.useState(idx)
      React.useEffect(function () { setLabelIdx(idx) }, [idx])

      if (efforts.length === 0) return null

      const busy = state.status === 'selecting'
      const currentLabel = efforts[labelIdx] ? efforts[labelIdx].name : ''

      function commit(i) {
        if (locked) return
        const selection = { provider: current.provider, model: current.model }
        if (efforts[i] && efforts[i].id !== undefined) selection.reasoningEffort = efforts[i].id
        select(selection).catch(function () {})
      }

      return React.createElement('div', {
        className: 'dms-effort',
        title: '思考强度：' + currentLabel + '（Ctrl+T 轮换）',
      },
        React.createElement('span', { className: 'dms-effort-name' }, '思考'),
        React.createElement('input', {
          key: 'effort-' + idx,
          type: 'range',
          className: 'dms-effort-range',
          min: 0,
          max: efforts.length - 1,
          step: 1,
          defaultValue: idx,
          disabled: locked || busy,
          'aria-label': '思考强度',
          onChange: function (e) {
            const i = Number(e.target.value)
            setLabelIdx(i)
            commit(i)
          },
        }),
        React.createElement('span', { className: 'dms-effort-value' }, currentLabel),
      )
    }

    // ── ModelToolbox (the composer model seat) ──────────────────────────────
    function ModelToolbox(props) {
      const locked = props.locked
      const available = props.available
      const directory = props.directory
      const load = props.load
      const select = props.select

      const state = React.useSyncExternalStore(
        function (fn) { return directory.subscribe(fn) },
        function () { return directory.getSnapshot() },
      )
      const favs = React.useSyncExternalStore(favSubscribe, readFavs)

      React.useEffect(function () {
        if (!available) return
        activeRef.directory = directory
        activeRef.select = select
        activeRef.available = available
        return function () {
          if (activeRef.directory === directory) {
            activeRef.directory = null
            activeRef.select = null
            activeRef.available = false
          }
        }
      }, [directory, select, available])

      React.useEffect(function () {
        if (available) load()
      }, [available, load])

      const choices = React.useMemo(function () { return choicesOf(state.groups) }, [state.groups])
      const current = state.current
      const currentChoice = current
        ? choices.find(function (c) { return c.group.id === current.provider && c.model.id === current.model }) || null
        : null
      const reasoning = currentChoice ? currentChoice.model.reasoning : null

      if (!available) return null

      return React.createElement('div', { className: 'dms-root' },
        React.createElement(ModelDropdown, {
          locked: locked,
          state: state,
          choices: choices,
          current: current,
          currentChoice: currentChoice,
          select: select,
          load: load,
          favs: favs,
        }),
        reasoning ? React.createElement(EffortSlider, {
          locked: locked,
          state: state,
          current: current,
          reasoning: reasoning,
          select: select,
        }) : null,
      )
    }

    // ── Plugin body ─────────────────────────────────────────────────────────
    const inject = ['slots', 'sessions', 'modelDirectories']

    function apply(ctx) {
      ctx.effect(function () {
        document.addEventListener('keydown', onKeydown, true)
        return function () { document.removeEventListener('keydown', onKeydown, true) }
      })

      ctx.inject(['slots', 'sessions', 'modelDirectories'], function (scope) {
        const models = scope.modelDirectories
        const sessions = scope.sessions
        scope.slots.inject('conversation.input.model', function () {
          return scope.slots.register({
            name: 'conversation.input.model',
            priority: -1, // shadow the built-in ModelSelect (priority 0)
            inject: function (sessionId) {
              const directory = models.directoryFor(sessionId)
              const available = sessions.subagentAddress(sessionId) === void 0
              return {
                available: available,
                directory: directory.store,
                load: function () { if (available) directory.load().catch(function () {}) },
                select: function (selection) {
                  return available
                    ? directory.select(selection).then(function () { return true }, function () { return false })
                    : Promise.resolve(false)
                },
              }
            },
          }, ModelToolbox)
        })
      })
    }

    exports.apply = apply
    exports.inject = inject
    return module.exports
  },
})
