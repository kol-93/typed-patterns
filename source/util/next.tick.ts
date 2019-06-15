import { TypedFunction } from './typed.function';

/**
 * Returns global or window. Depends on environment
 */
function getGlobal(): any {
    if (typeof global === 'object') {
        return global;
        // @ts-ignore
    } else if (typeof window === 'object') {
        // @ts-ignore
        return window;
    } else {
        throw new Error('Can not deal with this environment. Go fuck yourself');
    }
}

/**
 * Returns a function that can set up your operator as soon as possible in your environment
 */
function getNextTick(): Function {
    const glob = getGlobal();
    if (glob.process && typeof glob.process.nextTick === 'function') {
        return glob.process.nextTick;
    } else if (typeof glob.setImmediate === 'function') {
        return glob.setImmediate;
    } else if (typeof glob.Promise === 'function') {
        return function nextTick(operator: Function) {
            const args = Array.prototype.slice.call(arguments, 1);
            return Promise.resolve().then(() => {
                operator.apply(null, args);
            }).catch(() => undefined);
        };
    } else if (typeof glob.MutationObserver === 'function') {
        const element = glob.document.createElement('a');
        const createQueue = (): Array<Function> => {
            return new Array(16);
        };
        let queue = createQueue();
        let fire = false;
        let callCounter = 0;
        let fireCounter = 0;
        const observer = new glob.MutationObserver(function () {
            let len = callCounter;
            const track = queue;
            callCounter = 0;
            fire = false;
            queue = createQueue();
            for (let i = 0; i < len; ++i) {
                try {
                    track[i]();
                } catch (e) {}
            }
        });
        observer.observe(element, {
            attributes: true,
            attributeFilter: ['lang']
        });
        return function nextTick(operator: Function, ...args: any[]) {
            queue[callCounter++] = operator.bind(null, ...args);
            if (!fire) {
                fire = true;
                element.setAttribute('lang', (fireCounter++).toString());
            }
        };
    } else {
        return function (operator: Function) {
            const args = Array.prototype.slice.call(arguments, 1);
            setTimeout(() => {
                operator.apply(null, args);
            }, 1);
        }
    }
}

export function nextTick<Args extends any[], Result>(operator: TypedFunction<Args, Result>, ...args: Args) {
    if (typeof operator !== 'function') {
        throw new TypeError('Function expected');
    }
    _nextTick(operator, ...args);
}

var _nextTick = getNextTick();
