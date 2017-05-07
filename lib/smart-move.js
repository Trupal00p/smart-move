'use babel';

import SmartMoveView from './smart-move-view';
import { CompositeDisposable } from 'atom';
import * as path from 'upath'
import fs from 'fs-plus'
import shell from 'shelljs'

export default {

	smartMoveView : null,
	modalPanel : null,
	subscriptions : null,

	activate( state ) {

		this.smartMoveView = new SmartMoveView(state.smartMoveViewState, ( ) => {

			this
				.modalPanel
				.hide( )

			const editor = atom
				.workspace
				.getActiveTextEditor( )

			if ( editor ) {
				const fileCurrentAbsPath = path.toUnix(editor.getPath( ));
				const fileNewAbsPath = path.toUnix(this.smartMoveView.getTextEditor( ).buffer.getText( ));

				const fileCurrentDir = path.dirname( fileCurrentAbsPath )
				const fileNewDir = path.dirname( fileNewAbsPath )

				if ( fileCurrentAbsPath ) {
					const tBuffer = editor.getBuffer( );
					const tRange = tBuffer.getRange( );
					tBuffer.backwardsScanInRange(/(import.+?['"]|require\(.+?['"])([\.]{1,2}[\.\\/\w-]+?)(['"])/igm, tRange, ( args ) => {

						const matchedPath = args.match[2]

						if (!path.isAbsolute( matchedPath )) {

							const importedAbsPath = path.resolve( fileCurrentDir + '\\' + matchedPath )
							let importedNewRelPath = path.relative( fileNewDir, importedAbsPath )

							if (!importedNewRelPath.startsWith( '.' )) {
								importedNewRelPath = './' + importedNewRelPath
							}

							args.replace(args.match[1] + importedNewRelPath + args.match[3])

						}

					})

				}

				editor.saveAs( fileNewAbsPath );

				if (fs.existsSync( fileCurrentAbsPath )) {
					fs.removeSync( fileCurrentAbsPath );
					atom
						.project
						.getRepositories( )
						.forEach(( repo ) => {
							repo
								? repo.getPathStatus( fileCurrentAbsPath )
								: null
						})
				}

				const projectPath = path.toUnix( atom.project.getDirectories( )[ 0 ].path)

				const files = shell.find( projectPath )
				const includeRegex = /\.(js|jsx|gql|txt|json|yml|yaml)$/i
				const excludeRegex = /node_modules/i

				files.map(( filePath ) => {
					if (includeRegex.test( filePath ) && !excludeRegex.test( filePath )) {

						fs.readFile(filePath, 'utf8', ( err, content ) => {

							if (err) throw err;

							let changed = false
							const fileDir = path.dirname( filePath )

							const result = content.replace(/(import.+?['"])([\.]{1,2}[\.\\/\w-]+?)(['"])/igm, ( match, sectionOne, sectionTwo, sectionThree, offset, string ) => {

								const importedAbsPath = path.resolve( fileDir + '\\' + sectionTwo )

								if ( importedAbsPath === fileCurrentAbsPath ) {

									changed = true;

									let importedNewRelPath = path.relative( fileDir, fileNewAbsPath )

									if (!importedNewRelPath.startsWith( '.' )) {
										importedNewRelPath = './' + importedNewRelPath
									}

									return sectionOne + importedNewRelPath + sectionThree
								} else {
									return match
								}

							});

							if ( changed ) {
								fs
									.writeFile( filePath, result, 'utf8', function ( err ) {
										if ( err )
											return console.log( err );
										atom
											.project
											.getRepositories( )
											.forEach(( repo ) => {
												repo
													? repo.getPathStatus( filePath )
													: null
											})
									});
							}

						})

					}
				})
			}
		});

		this.modalPanel = atom
			.workspace
			.addModalPanel({
				item: this
					.smartMoveView
					.getElement( ),
				visible: false
			});

		// Events subscribed to in atom's system can be
		// easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable( );

		// Register command that toggles this view
		this
			.subscriptions
			.add(atom.commands.add('atom-workspace', {
				'smart-move:toggle': ( ) => this.toggle( )
			}));
	},

	deactivate( ) {
		this
			.modalPanel
			.destroy( );
		this
			.subscriptions
			.dispose( );
		this
			.smartMoveView
			.destroy( );
	},

	serialize( ) {},

	toggle( ) {
		if (this.modalPanel.isVisible( )) {
			this
				.modalPanel
				.hide( )
		} else {
			const editor = atom
				.workspace
				.getActiveTextEditor( )
			const miniEditor = this
				.smartMoveView
				.getTextEditor( );
			const buffer = miniEditor.buffer;
			buffer.setText(editor.getPath( ));
			miniEditor.setCursorBufferPosition([ 0, 0, ]);
			miniEditor.selectAll( );
			this
				.modalPanel
				.show( )
		}
		return

	},
};
