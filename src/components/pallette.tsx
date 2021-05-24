import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Transition} from '@headlessui/react';
import {useHotkeys} from 'react-hotkeys-hook';
import {CommandItem, CommandItemView} from './commandItem';
import {AnimatePresence, AnimateSharedLayout, motion} from 'framer-motion';

export const Palette = ({items}: {items: CommandItem[]}) => {
	const [open, setOpen] = useState(false);

	useHotkeys(
		'cmd+k,ctrl+k',
		e => {
			e.preventDefault();
			setOpen(v => !v);
		},
		{
			enableOnTags: ['INPUT'],
		}
	);

	useEffect(() => {
		document.body.style.overflowY = open ? 'hidden' : 'auto';
	}, [open]);

	return (
		<Transition
			show={open}
			className="
				fixed
				top-0
				right-0
				bottom-0
				left-0
				bg-overlay-light
				dark:bg-overlay-dark
				transition-all
				transform"
			enterFrom="opacity-0"
			enterTo="opacity-100"
			leaveFrom="opacity-100"
			leaveTo="opacity-0"
		>
			<CommandContainer
				items={items}
				close={() => {
					setOpen(false);
				}}
			/>
		</Transition>
	);
};

const CommandContainer = ({items, close}: {items: CommandItem[]; close: () => void}) => {
	const [predicate, setPredicate] = useState('');
	const [selected, setSelected] = useState<string|undefined>(items[0]?.key);

	const itemMap = useMemo(() => {
		return items.reduce<Record<string, CommandItem>>((map, item) => {
			map[item.key] = item;
			return map;
		}, {});
	}, [items]);

	const filteredItems = useMemo(() => {
		if (predicate.length <= 0) {
			return items;
		}

		return items.filter(item => item.name.toLowerCase().includes(predicate.toLowerCase()));
	}, [items, predicate]);

	const ref = useOutsideClick<HTMLDivElement>(close);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const acceptCommand = () => {
		if (selected !== undefined) {
			const command = itemMap[selected];
			// eslint-disable-next-line no-alert
			alert(command.name);
		}
	};

	useHotkeys('esc', close, {
		enableOnTags: ['INPUT'],
	});

	useHotkeys('enter', acceptCommand, {
		enableOnTags: ['INPUT'],
	});

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	useEffect(() => {
		setSelected(filteredItems[0]?.key);
	}, [filteredItems, items]);

	const moveFocus = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (filteredItems.length <= 0) {
			return;
		}

		// eslint-disable-next-line no-negated-condition
		const selectedIndex = selected !== undefined ? filteredItems.indexOf(itemMap[selected]) : 0;

		switch (e.key) {
			case 'ArrowDown': {
				setSelected(filteredItems[(selectedIndex + 1) % filteredItems.length].key);
				break;
			}

			case 'ArrowUp': {
				setSelected(filteredItems[selectedIndex - 1]?.key ?? filteredItems[filteredItems.length - 1]?.key);
				break;
			}

			default: {
				break;
			}
		}
	};

	return (
		<Transition.Child
			className="flex justify-center items-center h-full transition-all transform-gpu"
			enterFrom="scale-95 opacity-0"
			enterTo="scale-100 opacity-100"
			leaveFrom="scale-100 opacity-100"
			leaveTo="scale-75 opacity-0"
		>
			<AnimateSharedLayout>
				<motion.div
					ref={ref}
					layout
					transition={{
						type: 'spring',
						damping: 80,
						stiffness: 2000,
					}}
					className="
						flex
						overflow-hidden
						flex-col
						w-3/4
						max-w-screen-sm
						max-h-96
						rounded-xl
						border
						border-separator-light
						dark:border-separator-dark
						text-pallette-foreground-light
						dark:text-pallette-foreground-dark
						bg-pallette-background-light
						dark:bg-pallette-background-dark
					"
				>
					<motion.div layout className="flex">
						<input
							ref={inputRef}
							type="text"
							placeholder="Search"
							className="
								flex-1
								py-4
								px-5
								text-lg
								appearance-none
								focus:outline-none
								text-highlight-foreground-light
								dark:text-highlight-foreground-dark
								bg-pallette-background-light
								dark:bg-pallette-background-dark"
							value={predicate}
							onInput={e => {
								setPredicate((e.target as HTMLInputElement).value);
							}}
							onKeyDown={moveFocus}
						/>
					</motion.div>

					<div className="mx-3 h-px bg-separator-light dark:bg-separator-dark" />
					{filteredItems.length === 0 && (
						<div className="mx-3 text-center">
							<div className="flex justify-center items-center pt-4 h-16">
								<h2 className="inline">No Items</h2>
							</div>
						</div>
					)}
					<div className="overflow-x-hidden py-2">
						<AnimatePresence>
							{filteredItems.map(item => {
								return (
									<CommandItemView
										key={item.key}
										item={item}
										selected={item.key === selected}
										setSelected={setSelected}
										click={acceptCommand}
									/>
								);
							})}
						</AnimatePresence>
					</div>
				</motion.div>
			</AnimateSharedLayout>
		</Transition.Child>
	);
};

/**
 * Handle clicks outside of an element.
 * This is useful for closing a modal by clicking outside of the modal.
 * @param callback - The callback function to run when clicking outside of an element
 */
export function useOutsideClick<E extends HTMLElement = HTMLElement>(callback: () => unknown) {
	const container = useRef<E | null>(null);

	const stableCallback = useCallback(() => callback(), [callback]);

	useEffect(() => {
		const handler = (event: MouseEvent) => {
			if (!container.current) {
				return;
			}

			if (!container.current.contains(event.target as HTMLElement)) {
				stableCallback();
			}
		};

		document.addEventListener('click', handler);

		return () => {
			document.removeEventListener('click', handler);
		};
	}, [stableCallback]);

	return container;
}
