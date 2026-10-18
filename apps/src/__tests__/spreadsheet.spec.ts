// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import {
  evaluateFormula,
  evaluateFormulaRaw,
  isExpectingReference,
  normalizeOpenFormula,
  shiftFormulaReferences,
} from '@huuk/tables/formula'
import FormulaBar from '@huuk/ui/FormulaBar.vue'
import SheetGrid from '@huuk/tables/SheetGrid.vue'

describe('LibreOffice Calc & OpenFormula Engine (formula.ts)', () => {
  const sampleGrid: Record<string, Record<number, unknown>> = {
    Main: {
      // row 1: [10, 20, "$1,200.50", "25%"]
      0: 10,
      1: 20,
      2: '$1,200.50',
      3: '25%',
    },
    Tasks: {
      0: 'Ship Quest Map v2',
      3: 8,
    },
  }

  const ctx = {
    resolve: (col: number, row: number, sheet?: string) => {
      if (sheet === 'Tasks') return sampleGrid.Tasks[col] ?? ''
      if (row === 1) return sampleGrid.Main[col] ?? ''
      if (row === 2) return col === 0 ? 30 : col === 1 ? 40 : ''
      return ''
    },
    resolveName: (name: string) => {
      if (name === 'MyNums') return { c1: 0, r1: 1, c2: 1, r2: 2 }
      if (name === 'TaxRate') return 0.07
      return undefined
    },
    resolveEntry: (target: string, field?: string) => {
      if (target === 'Health & Fitness') {
        return field === 'icon' ? '💪' : 'Health & Fitness'
      }
      return undefined
    },
  }

  it('normalizes OpenFormula syntax from LibreOffice Calc .ods files', () => {
    expect(normalizeOpenFormula('of:=SUM([.B3:.B9]; [.C3:.C9])')).toBe('=SUM(B3:B9; C3:C9)')
    expect(normalizeOpenFormula('of:=[$Tasks.$D$1]*2')).toBe('=Tasks!$D$1*2')
  })

  it('evaluates absolute/mixed refs ($A$1), semicolon separators (;), currency & percent strings', () => {
    expect(evaluateFormula('=SUM($A$1:$B$2)', ctx)).toBe('100')
    expect(evaluateFormula('=SUM(A1; B1; A2)', ctx)).toBe('60')
    expect(evaluateFormula('=C1 + 99.5', ctx)).toBe('1300')
    expect(evaluateFormula('=A1 * D1', ctx)).toBe('2.5')
  })

  it('evaluates cross-sheet references and Named Ranges', () => {
    expect(evaluateFormula('=Tasks!D1 * 5', ctx)).toBe('40')
    expect(evaluateFormula('=SUM(MyNums) * (1 + TaxRate)', ctx)).toBe('107')
  })

  it('evaluates LibreOffice Calc scientific/statistical/financial functions & FOURIER DFT', () => {
    expect(evaluateFormula('=SUMPRODUCT(A1:B1; A2:B2)', ctx)).toBe('1100')
    expect(evaluateFormula('=XOR(TRUE(); FALSE())', ctx)).toBe('TRUE')
    expect(evaluateFormula('=ROUND(SIN(RADIANS(30)); 4)', ctx)).toBe('0.5')

    // FOURIER of [1, 0; 1, 0] (2 complex points: 1+0i, 1+0i) -> DC=2+0i, Nyquist=0+0i
    const dft = evaluateFormulaRaw('=FOURIER(A1:B2; TRUE)', {
      resolve: (c) => (c === 0 ? 1 : 0),
    })
    expect(Array.isArray(dft)).toBe(true)
    const mat = dft as number[][]
    expect(mat[0][0]).toBeCloseTo(2, 6)
    expect(mat[0][1]).toBeCloseTo(0, 6)
    expect(mat[1][0]).toBeCloseTo(0, 6)
  })

  it('resolves Pugu [[Wiki-Links]] and =ENTRY() formulas', () => {
    expect(evaluateFormula('=ENTRY("Health & Fitness", "icon")', ctx)).toBe('💪')
    expect(evaluateFormula('=LINK("[[Health & Fitness]]", "icon")', ctx)).toBe('💪')
  })

  it('shifts relative references while preserving $ locks (MoveRelWrap)', () => {
    expect(shiftFormulaReferences('=SUM(A1:B2) + $C$1 + $D1 + E$1', 2, 1)).toBe(
      '=SUM(B3:C4) + $C$1 + $D3 + F$1',
    )
  })

  it('detects Point-and-Click reference expectation accurately', () => {
    expect(isExpectingReference('=')).toBe(true)
    expect(isExpectingReference('=SUM(')).toBe(true)
    expect(isExpectingReference('=SUM(A1, ')).toBe(true)
    expect(isExpectingReference('=SUM(A1; ')).toBe(true)
    expect(isExpectingReference('=A1+')).toBe(true)
    expect(isExpectingReference('=SUM(A1)')).toBe(false)
    expect(isExpectingReference('Hello')).toBe(false)
  })
})

describe('SheetGrid & FormulaBar Point-and-Click Integration', () => {
  it('allows Point-and-Click cell and range selection while typing a formula without premature commit', async () => {
    const wrapper = mount(SheetGrid, {
      props: {
        columns: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
        rows: [
          { id: 1, a: '10', b: '20', c: '' },
          { id: 2, a: '30', b: '40', c: '' },
        ],
      },
    })

    // Start editing from FormulaBar at C1 (r=0, c=2)
    const vm = wrapper.vm as unknown as {
      goTo: (ref: string) => boolean
      applyDraft: (val: string) => void
    }
    vm.goTo('C1')
    vm.applyDraft('=SUM(')
    await wrapper.vm.$nextTick()

    const tds = wrapper.findAll('tbody tr:first-child td.p-sheet-td')
    // Click A1 (first data cell) while editing '=SUM('
    await tds[0].trigger('mousedown')
    expect(wrapper.emitted('edit-draft')?.at(-1)?.[0]).toBe('=SUM(A1')

    // Drag to B1 (second data cell) -> range becomes A1:B1
    await tds[1].trigger('mouseenter')
    expect(wrapper.emitted('edit-draft')?.at(-1)?.[0]).toBe('=SUM(A1:B1')
  })

  it('emits define-name from FormulaBar when user enters a named range identifier', async () => {
    const fb = mount(FormulaBar, {
      props: {
        cellRef: 'D2:D4',
        value: '',
        disabled: false,
        namedRanges: { Estimates: 'D2:D4' },
      },
    })
    const refInput = fb.find('.p-fb-ref')
    await refInput.setValue('SprintTotal')
    await refInput.trigger('keydown.enter')
    expect(fb.emitted('define-name')?.[0]).toEqual(['SprintTotal', 'D2:D4'])
  })
})
