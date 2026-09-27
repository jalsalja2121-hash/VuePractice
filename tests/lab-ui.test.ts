import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import WebLab from '../src/components/WebLab.vue'
import VisionLab from '../src/components/VisionLab.vue'
import MappingLab from '../src/components/MappingLab.vue'
import HomeView from '../src/views/HomeView.vue'
import LabView from '../src/views/LabView.vue'
import App from '../src/App.vue'

afterEach(() => { vi.useRealTimers() })
describe('learning flows', () => {
  it('home exposes separate notebook and lab destinations', () => {
    const view = mount(HomeView)
    expect(view.find('a[href="#/practice"]').exists()).toBe(true)
    expect(view.find('a[href="#/lab"]').exists()).toBe(true)
    view.unmount()
  })
  it('Vue input updates the displayed product and total', async () => {
    const view = mount(WebLab, { props: { kind: 'vue' } })
    await view.find('input').setValue('새 상품')
    await view.find('input[type=range]').setValue(3)
    expect(view.text()).toContain('새 상품')
    expect(view.text()).toContain('36,000원')
    view.unmount()
  })
  it('payment rejects a mismatched amount then completes and resets', async () => {
    const view = mount(WebLab, { props: { kind: 'payment' } })
    const next = () => view.find('button.primary').trigger('click')
    await next(); await next()
    await view.find('input[type=checkbox]').setValue(true)
    await next()
    expect(view.find('[role=status]').text()).toContain('승인 거절')
    expect(view.find('button.primary').attributes('disabled')).toBeUndefined()
    await view.find('input[type=checkbox]').setValue(false)
    await next()
    expect(view.find('[role=status]').text()).toContain('모의 승인 완료')
    expect(view.find('button.primary').attributes('disabled')).toBeDefined()
    await view.findAll('button')[1]!.trigger('click')
    expect(view.find('button.primary').text()).toBe('주문 만들기')
    view.unmount()
  })
  it('signature requires a name and explicit confirmation', async () => {
    const view = mount(WebLab, { props: { kind: 'signature' } })
    await view.find('input').setValue(' ')
    expect(view.find('button.primary').attributes('disabled')).toBeDefined()
    await view.find('input').setValue('김실습')
    await view.find('button.primary').trigger('click')
    await view.find('button.primary').trigger('click')
    expect(view.find('button.primary').attributes('disabled')).toBeDefined()
    await view.find('input[type=checkbox]').setValue(true)
    await view.find('button.primary').trigger('click')
    expect(view.text()).toContain('김실습 · 모의 서명 완료')
    view.unmount()
  })
  it('vision threshold filters fixtures and leaving stops playback', async () => {
    vi.useFakeTimers()
    const view = mount(VisionLab)
    await view.find('input[type=range]').setValue(1)
    expect(view.text()).toContain('표시 0개')
    await view.find('button.primary').trigger('click')
    vi.advanceTimersByTime(800); await nextTick()
    expect(view.text()).toContain('frame 2')
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('voxel resolution and scan reset update the map', async () => {
    const view = mount(MappingLab)
    await view.find('select').setValue('0.1')
    expect(view.text()).toContain('64,000복셀')
    expect(view.findAll('svg rect')).toHaveLength(1600)
    await view.findAll('button')[1]!.trigger('click')
    expect(view.text()).toContain('가상 스캔 진행 0%')
    expect(view.findAll('svg rect')).toHaveLength(400)
    view.unmount()
  })
  it('module selection resets previous simulation state', async () => {
    const view = mount(LabView)
    const modules = view.findAll('.module-nav button')
    await modules[1]!.trigger('click')
    await view.find('button.primary').trigger('click')
    await modules[2]!.trigger('click')
    await modules[1]!.trigger('click')
    expect(view.find('button.primary').text()).toBe('주문 만들기')
    view.unmount()
  })
  it('hash navigation handles direct lab entry and missing pages', async () => {
    window.scrollTo = vi.fn()
    window.location.hash = '#/lab'
    const view = mount(App)
    await flushPromises()
    await vi.waitFor(() => expect(view.text()).toContain('Vue 반응형 데이터'))
    window.location.hash = '#/missing'
    window.dispatchEvent(new Event('hashchange'))
    await nextTick()
    expect(view.text()).toContain('페이지를 찾을 수 없습니다.')
    window.location.hash = '#/'
    window.dispatchEvent(new Event('hashchange'))
    await nextTick()
    expect(view.text()).toContain('연습장 들어가기')
    view.unmount()
  })
})
