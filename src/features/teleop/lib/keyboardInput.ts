/**
 * キーボード押下状態の外部ソース。
 * 最初の購読で DOM リスナーを登録し、最後の購読解除で取り外す。
 */
export interface KeyboardInput {
    readonly subscribe: (listener: () => void) => () => void
    readonly getKeys: () => ReadonlySet<string>
}

/** テキスト編集系の要素へのキー入力か(操縦キーとして拾ってはいけない) */
function isEditableTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLElement &&
        target.matches("input, textarea, select, [contenteditable=true]")
    )
}

/**
 * keydown / keyup / blur を監視するキーボード入力ソースを生成する。
 *
 * @param preventDefaultKeys 押下時にブラウザ既定動作を抑止するキー (小文字)。
 *   操縦に使う矢印キーの画面スクロールを止めるために渡す。キーリピート中も
 *   抑止し続ける (押しっぱなしでスクロールしないように)。
 */
export function createKeyboardInput(
    target: EventTarget,
    preventDefaultKeys: Iterable<string> = [],
): KeyboardInput {
    const preventKeys = new Set(preventDefaultKeys)
    let keys = new Set<string>()
    const listeners = new Set<() => void>()

    const notify = (): void => {
        for (const listener of listeners) {
            listener()
        }
    }

    const handleKeyDown = (event: Event): void => {
        if (!(event instanceof KeyboardEvent) || isEditableTarget(event.target)) {
            return
        }
        const key = event.key.toLowerCase()
        // 抑止対象はキーリピートでも毎回止める (押下集合の更新有無より前に判定する)
        if (preventKeys.has(key)) {
            event.preventDefault()
        }
        if (keys.has(key)) {
            return
        }
        keys = new Set(keys).add(key)
        notify()
    }

    const handleKeyUp = (event: Event): void => {
        if (!(event instanceof KeyboardEvent)) {
            return
        }
        const key = event.key.toLowerCase()
        if (!keys.has(key)) {
            return
        }
        const next = new Set(keys)
        next.delete(key)
        keys = next
        notify()
    }

    const handleBlur = (): void => {
        if (keys.size === 0) {
            return
        }
        keys = new Set()
        notify()
    }

    const attach = (): void => {
        target.addEventListener("keydown", handleKeyDown)
        target.addEventListener("keyup", handleKeyUp)
        target.addEventListener("blur", handleBlur)
    }

    const detach = (): void => {
        target.removeEventListener("keydown", handleKeyDown)
        target.removeEventListener("keyup", handleKeyUp)
        target.removeEventListener("blur", handleBlur)
        handleBlur()
    }

    return {
        subscribe: (listener) => {
            if (listeners.size === 0) {
                attach()
            }
            listeners.add(listener)
            return () => {
                listeners.delete(listener)
                if (listeners.size === 0) {
                    detach()
                }
            }
        },
        getKeys: () => keys,
    }
}
