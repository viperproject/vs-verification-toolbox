export interface InstallResult<T> {
	isSuccess(): boolean
}

export class Success<T> implements InstallResult<T> {
	/** non-null */
	private readonly _value: T;

	/**
 	 * @param t non-null
 	 */
	constructor(t: T) {
		if (t == null) {
			throw new Error(`Invalid argument: Success(v) can only be constructed with a non-null value`);
		}
		this._value = t;
	}

	public get value(): T {
		return this._value;
	}

	public isSuccess(): boolean {
		return true;
	}
}

export class Canceled<T> implements InstallResult<T> {
	public isSuccess(): boolean {
		return false;
	}
}

export enum ConfirmResult {
	Cancel = 0,
	Continue,
}
